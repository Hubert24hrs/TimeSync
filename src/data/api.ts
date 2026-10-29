import * as Crypto from 'expo-crypto';
import { DateTime } from 'luxon';
import {
    assistantReply,
    bookableSlots,
    bookingRequestSchema,
    chooseHost,
    groupByDay,
    pollWinner,
    slotBadges,
    type EventContext,
    type HostContext,
} from '../engine';
import { isBackendConfigured } from '../lib/config';
import { callFunction, requireSupabase } from '../lib/supabase';
import { store } from '../store/store';
import * as ws from '../store/slices/workspaceSlice';
import type { WorkspaceState } from '../store/slices/workspaceSlice';
import type { AvailabilitySchedule, Booking, CalendarConnection, ChatMessage, EventType, Poll, Profile, SlotSuggestion, Webhook } from '../types';
import { demoBookings, demoEventTypes, demoMe, demoPolls, demoRoutingForms, demoSchedules, demoTeam, demoWebhooks, toParticipant, DEMO_USER_ID } from './demo';

// Data access. In demo mode everything runs on-device against the workspace slice; in cloud mode
// reads come from Supabase (RLS-protected) and writes go to Supabase first, then the local cache.

const isCloud = () => store.getState().auth.mode === 'cloud';
/** Public pages talk to the server unless this device is running the demo (or there is no backend). */
const publicRemote = () => isBackendConfigured && store.getState().auth.mode !== 'demo';
const dispatch = store.dispatch;
export const newId = () => Crypto.randomUUID();

export function seedDemoWorkspace(timezone?: string): void {
    const me = demoMe(timezone);
    dispatch(
        ws.seedWorkspace({
            me,
            team: demoTeam,
            schedules: demoSchedules(me.timezone),
            eventTypes: demoEventTypes,
            bookings: demoBookings(me),
            polls: demoPolls(me),
            routingForms: demoRoutingForms,
            webhooks: demoWebhooks,
            calendars: [],
        }),
    );
}

// ───────────────────────────── Row mapping (cloud) ─────────────────────────────
const rowToProfile = (p: any, email = ''): Profile => ({
    id: p.id,
    username: p.username,
    name: p.display_name || p.username,
    email,
    timezone: p.timezone,
    chronotype: p.chronotype,
    countryCode: p.country_code ?? undefined,
    workingHours: { start: Number(p.working_start), end: Number(p.working_end) },
});

const rowToEventType = (r: any): EventType => ({
    id: r.id,
    ownerId: r.owner_id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? undefined,
    kind: r.kind,
    durationMinutes: r.duration_minutes,
    slotIntervalMinutes: r.slot_interval_minutes ?? undefined,
    bufferBeforeMinutes: r.buffer_before_minutes,
    bufferAfterMinutes: r.buffer_after_minutes,
    minimumNoticeMinutes: r.minimum_notice_minutes,
    maxPerDay: r.max_per_day ?? undefined,
    rollingWindowDays: r.rolling_window_days ?? undefined,
    seats: r.seats ?? undefined,
    location: r.location,
    color: r.color,
    scheduleId: r.schedule_id,
    hostIds: r.event_type_hosts?.length ? r.event_type_hosts.map((h: any) => h.user_id) : [r.owner_id],
    questions: r.questions ?? [],
    active: r.active,
});

const rowToBooking = (b: any): Booking => ({
    id: b.id,
    eventTypeId: b.event_type_id,
    hostId: b.host_id,
    inviteeName: b.invitee_name,
    inviteeEmail: b.invitee_email,
    inviteeTimezone: b.invitee_timezone,
    start: b.start_at,
    end: b.end_at,
    status: b.status,
    answers: b.answers,
    meetingUrl: b.meeting_url ?? undefined,
    fairnessScore: b.fairness_score ?? undefined,
    createdAt: b.created_at,
});

/** Pulls the signed-in user's workspace from Supabase into the offline cache. */
export async function syncCloudWorkspace(): Promise<WorkspaceState> {
    const db = requireSupabase();
    const { data: auth } = await db.auth.getUser();
    if (!auth.user) throw new Error('Not signed in');
    const uid = auth.user.id;
    const [profile, memberships, schedules, eventTypes, bookings, polls, forms, hooks, calendars] = await Promise.all([
        db.from('profiles').select('*').eq('id', uid).single(),
        db.from('team_members').select('team_id').eq('user_id', uid),
        db.from('schedules').select('*').eq('owner_id', uid),
        db.from('event_types').select('*, event_type_hosts(user_id)'),
        db.from('bookings').select('*').eq('host_id', uid).gte('start_at', DateTime.now().minus({ days: 60 }).toISO()).order('start_at'),
        db.from('polls').select('*, poll_options(*), poll_votes(*)'),
        db.from('routing_forms').select('*').eq('owner_id', uid),
        db.from('webhooks').select('id, url, events, active').eq('owner_id', uid),
        db.from('calendar_connections').select('id, provider, account_email, last_synced_at').eq('user_id', uid),
    ]);
    if (profile.error) throw profile.error;
    const teamIds = (memberships.data ?? []).map((m: any) => m.team_id);
    const mates = teamIds.length ? await db.from('team_members').select('profiles(*)').in('team_id', teamIds).neq('user_id', uid) : { data: [] as any[] };

    const state: WorkspaceState = {
        seeded: true,
        me: rowToProfile(profile.data, auth.user.email ?? ''),
        team: [...new Map((mates.data ?? []).map((m: any) => [m.profiles.id, rowToProfile(m.profiles)])).values()],
        schedules: (schedules.data ?? []).map((s: any) => ({ id: s.id, name: s.name, timezone: s.timezone, weekly: s.weekly, overrides: s.overrides })),
        eventTypes: (eventTypes.data ?? []).map(rowToEventType),
        bookings: (bookings.data ?? []).map(rowToBooking),
        polls: (polls.data ?? []).map((p: any) => ({
            id: p.id,
            title: p.title,
            durationMinutes: p.duration_minutes,
            status: p.status,
            participantIds: [...new Set([p.owner_id, ...(p.poll_votes ?? []).map((v: any) => v.voter_id)])] as string[],
            options: (p.poll_options ?? []).map((o: any) => ({ id: o.id, start: o.start_at, end: o.end_at })),
            votes: (p.poll_votes ?? []).map((v: any) => ({ voterId: v.voter_id, optionId: v.option_id, answer: v.answer })),
            winnerOptionId: p.winner_option_id ?? undefined,
            createdAt: p.created_at,
        })),
        routingForms: (forms.data ?? []).map((f: any) => ({ id: f.id, slug: f.slug, title: f.title, questions: f.questions, form: { id: f.id, rules: f.rules, fallback: f.fallback } })),
        webhooks: (hooks.data ?? []) as Webhook[],
        calendars: (calendars.data ?? []).map((c: any): CalendarConnection => ({ id: c.id, provider: c.provider, email: c.account_email, lastSyncedAt: c.last_synced_at ?? undefined })),
    };
    dispatch(ws.seedWorkspace(state));
    return state;
}

// ───────────────────────────── Mutations ─────────────────────────────
async function cloud<T>(op: () => PromiseLike<{ error: unknown; data?: T }>): Promise<T | undefined> {
    const { data, error } = await op();
    if (error) throw error instanceof Error ? error : new Error((error as { message?: string }).message ?? 'Request failed');
    return data;
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
    if (isCloud()) {
        const db = requireSupabase();
        const me = store.getState().workspace.me!;
        await cloud(() =>
            db
                .from('profiles')
                .update({
                    display_name: patch.name ?? me.name,
                    username: patch.username ?? me.username,
                    timezone: patch.timezone ?? me.timezone,
                    chronotype: patch.chronotype ?? me.chronotype,
                    country_code: patch.countryCode ?? me.countryCode ?? null,
                    working_start: patch.workingHours?.start ?? me.workingHours.start,
                    working_end: patch.workingHours?.end ?? me.workingHours.end,
                })
                .eq('id', me.id),
        );
    }
    dispatch(ws.updateMe(patch));
}

export async function saveSchedule(s: AvailabilitySchedule): Promise<void> {
    if (isCloud()) {
        const db = requireSupabase();
        await cloud(() => db.from('schedules').upsert({ id: s.id, owner_id: store.getState().workspace.me!.id, name: s.name, timezone: s.timezone, weekly: s.weekly, overrides: s.overrides }));
    }
    dispatch(ws.saveSchedule(s));
}

export async function deleteSchedule(id: string): Promise<void> {
    if (isCloud()) await cloud(() => requireSupabase().from('schedules').delete().eq('id', id));
    dispatch(ws.deleteSchedule(id));
}

export async function saveEventType(e: EventType): Promise<void> {
    if (isCloud()) {
        const db = requireSupabase();
        await cloud(() =>
            db.from('event_types').upsert({
                id: e.id,
                owner_id: e.ownerId,
                slug: e.slug,
                title: e.title,
                description: e.description ?? null,
                kind: e.kind,
                duration_minutes: e.durationMinutes,
                slot_interval_minutes: e.slotIntervalMinutes ?? null,
                buffer_before_minutes: e.bufferBeforeMinutes,
                buffer_after_minutes: e.bufferAfterMinutes,
                minimum_notice_minutes: e.minimumNoticeMinutes,
                max_per_day: e.maxPerDay ?? null,
                rolling_window_days: e.rollingWindowDays ?? null,
                seats: e.seats ?? null,
                location: e.location,
                color: e.color,
                schedule_id: e.scheduleId || null,
                questions: e.questions,
                active: e.active,
            }),
        );
        await cloud(() => db.from('event_type_hosts').delete().eq('event_type_id', e.id));
        if (e.hostIds.length) await cloud(() => db.from('event_type_hosts').insert(e.hostIds.map((user_id) => ({ event_type_id: e.id, user_id }))));
    }
    dispatch(ws.saveEventType(e));
}

export async function deleteEventType(id: string): Promise<void> {
    if (isCloud()) await cloud(() => requireSupabase().from('event_types').delete().eq('id', id));
    dispatch(ws.deleteEventType(id));
}

export async function setBookingStatus(b: Booking, status: Booking['status']): Promise<void> {
    if (isCloud()) await cloud(() => requireSupabase().from('bookings').update({ status }).eq('id', b.id));
    dispatch(ws.saveBooking({ ...b, status }));
}

export async function savePoll(p: Poll): Promise<void> {
    if (isCloud()) {
        const db = requireSupabase();
        await cloud(() => db.from('polls').upsert({ id: p.id, owner_id: store.getState().workspace.me!.id, title: p.title, duration_minutes: p.durationMinutes, status: p.status }));
        await cloud(() => db.from('poll_options').upsert(p.options.map((o) => ({ id: o.id, poll_id: p.id, start_at: o.start, end_at: o.end }))));
    }
    dispatch(ws.savePoll(p));
}

export async function vote(p: Poll, optionId: string, answer: Poll['votes'][number]['answer']): Promise<void> {
    const me = store.getState().workspace.me!;
    if (isCloud()) {
        await cloud(() => requireSupabase().from('poll_votes').upsert({ poll_id: p.id, option_id: optionId, voter_id: me.id, answer, updated_at: new Date().toISOString() }));
    }
    const votes = [...p.votes.filter((v) => !(v.voterId === me.id && v.optionId === optionId)), { voterId: me.id, optionId, answer }];
    dispatch(ws.savePoll({ ...p, votes }));
}

/** Picks the winner and books it (server writes calendar invites in cloud mode). */
export async function closePoll(p: Poll): Promise<{ winnerStart: string | null }> {
    if (isCloud()) {
        const res = await callFunction<{ winner: { id: string; start: string } | null }>('close-poll', { pollId: p.id });
        dispatch(ws.savePoll({ ...p, status: res.winner ? 'booked' : 'closed', winnerOptionId: res.winner?.id }));
        return { winnerStart: res.winner?.start ?? null };
    }
    const winner = pollWinner(
        p.options.map((o) => ({ id: o.id, start: Date.parse(o.start), end: Date.parse(o.end) })),
        p.votes,
    );
    dispatch(ws.savePoll({ ...p, status: winner ? 'booked' : 'closed', winnerOptionId: winner?.id }));
    return { winnerStart: winner ? new Date(winner.start).toISOString() : null };
}

export async function saveWebhook(w: Webhook): Promise<void> {
    if (!/^https:\/\//.test(w.url)) throw new Error('Webhook URLs must use https://');
    if (isCloud()) await cloud(() => requireSupabase().from('webhooks').upsert({ id: w.id, owner_id: store.getState().workspace.me!.id, url: w.url, events: w.events, active: w.active }));
    dispatch(ws.saveWebhook(w));
}

export async function deleteWebhook(id: string): Promise<void> {
    if (isCloud()) await cloud(() => requireSupabase().from('webhooks').delete().eq('id', id));
    dispatch(ws.deleteWebhook(id));
}

export async function slackLinkCode(): Promise<string> {
    if (!isCloud()) return 'demo-code-sign-in-to-link-slack';
    return (await callFunction<{ code: string }>('slack-command', {})).code;
}

// ───────────────────────────── Assistant ─────────────────────────────
export async function askAssistant(message: string, history: ChatMessage[]): Promise<Omit<ChatMessage, 'id' | 'timestamp' | 'sender'>> {
    const state = store.getState();
    const me = state.workspace.me;
    // Free plan and demo mode use the on-device assistant; Pro/Team get the AI model via the server.
    if (isCloud() && state.subscription.tier !== 'free') {
        const res = await callFunction<{ text: string; suggestions: SlotSuggestion[]; quickReplies: string[] }>('ai-chat', {
            message,
            history: history.slice(-10).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
        });
        return { text: res.text, suggestions: res.suggestions, quickReplies: res.quickReplies };
    }
    if (!me) return { text: 'Finish onboarding first and I will be ready to help.', quickReplies: [] };
    const reply = assistantReply(message, {
        now: Date.now(),
        user: toParticipant(me),
        team: state.workspace.team.map(toParticipant),
        meetings: state.workspace.bookings
            .filter((b) => b.status === 'confirmed')
            .map((b) => ({ title: state.workspace.eventTypes.find((e) => e.id === b.eventTypeId)?.title ?? 'Meeting', start: Date.parse(b.start), end: Date.parse(b.end) })),
    });
    return {
        text: reply.text,
        quickReplies: reply.quickReplies,
        suggestions: reply.suggestions.map((s) => ({ start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString(), fairness: s.fairnessScore, energy: s.energyScore, pros: s.pros, cons: s.cons })),
    };
}

// ───────────────────────────── Public booking ─────────────────────────────
export interface PublicSlot {
    start: string;
    label: string;
    fairness?: number;
    energy?: number;
    seatsLeft?: number;
}

export interface PublicEventPage {
    host: { name: string; username: string; timezone: string };
    eventType: Pick<EventType, 'title' | 'slug' | 'description' | 'kind' | 'durationMinutes' | 'color' | 'questions'> & { location: EventType['location']['kind']; hosts: { name: string; timezone: string }[] };
    timezone: string;
    days: { date: string; label: string; slots: PublicSlot[] }[];
}

/** Demo-mode equivalent of the server's loadEventContext, from the local workspace. */
function localContext(username: string, slug: string): { ctx: EventContext; host: Profile } {
    const w = store.getState().workspace;
    const people = w.me ? [w.me, ...w.team] : w.team;
    const owner = people.find((p) => p.username === username);
    const et = w.eventTypes.find((e) => e.slug === slug && e.ownerId === owner?.id && e.active);
    if (!owner || !et) throw new Error('Booking page not found');
    const hosts: HostContext[] = et.hostIds
        .map((id) => people.find((p) => p.id === id))
        .filter((p): p is Profile => !!p)
        .map((p) => {
            const schedule = (p.id === DEMO_USER_ID || p.id === w.me?.id ? w.schedules.find((s) => s.id === et.scheduleId) : undefined) ?? {
                id: `default-${p.id}`,
                name: 'Working hours',
                timezone: p.timezone,
                weekly: Object.fromEntries([1, 2, 3, 4, 5].map((d) => [d, [{ start: `${String(Math.floor(p.workingHours.start)).padStart(2, '0')}:00`, end: `${String(Math.floor(p.workingHours.end)).padStart(2, '0')}:00` }]])),
                overrides: [],
            };
            const mine = w.bookings.filter((b) => b.hostId === p.id && b.status === 'confirmed');
            const ofType = mine.filter((b) => b.eventTypeId === et.id);
            const toI = (b: Booking) => ({ start: Date.parse(b.start), end: Date.parse(b.end) });
            return {
                participant: toParticipant(p),
                schedule,
                busy: mine.filter((b) => !(et.kind === 'group' && b.eventTypeId === et.id)).map(toI),
                bookingsOfType: ofType.map(toI),
                load: ofType.length,
            };
        });
    return { ctx: { eventType: et, hosts }, host: owner };
}

export async function fetchPublicEvent(username: string, slug: string, timezone: string, from: number, days = 14): Promise<PublicEventPage> {
    if (publicRemote()) {
        return callFunction<PublicEventPage>('public-booking', undefined, {
            method: 'GET',
            query: { username, event: slug, tz: timezone, from: new Date(from).toISOString(), to: new Date(from + days * 86_400_000).toISOString() },
        });
    }
    const { ctx, host } = localContext(username, slug);
    const now = Date.now();
    const start = Math.max(from, now);
    const slots = bookableSlots(ctx, start, start + days * 86_400_000, now);
    const et = ctx.eventType;
    return {
        host: { name: host.name, username: host.username, timezone: host.timezone },
        eventType: { title: et.title, slug: et.slug, description: et.description, kind: et.kind, durationMinutes: et.durationMinutes, color: et.color, questions: et.questions, location: et.location.kind, hosts: ctx.hosts.map((h) => ({ name: h.participant.name, timezone: h.participant.timezone })) },
        timezone,
        days: groupByDay(slots, timezone).map((d) => ({
            date: d.date,
            label: d.label,
            slots: d.slots.map((s) => {
                const full = slots.find((x) => x.start === s.start)!;
                const badges = slotBadges(ctx, full, timezone);
                return { start: new Date(s.start).toISOString(), label: s.label, fairness: badges.fairness, energy: badges.energy, seatsLeft: full.seatsLeft };
            }),
        })),
    };
}

export interface BookingResult {
    booking: { id: string; start: string; end: string; meetingUrl: string | null; fairness?: number };
    manageUrl: string;
}

export async function createPublicBooking(input: unknown): Promise<BookingResult> {
    const parsed = bookingRequestSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Please check the form');
    if (publicRemote()) return callFunction<BookingResult>('public-booking', parsed.data);

    const req = parsed.data;
    const { ctx } = localContext(req.username, req.eventSlug);
    const start = Date.parse(req.start);
    const slot = bookableSlots(ctx, start - 86_400_000, start + 86_400_000, Date.now()).find((s) => s.start === start);
    if (!slot) throw new Error('That time is no longer available');
    const missing = ctx.eventType.questions.find((q) => q.required && !req.answers[q.id]?.trim());
    if (missing) throw new Error(`Please answer: ${missing.label}`);
    const booking: Booking = {
        id: newId(),
        eventTypeId: ctx.eventType.id,
        hostId: chooseHost(ctx, slot),
        inviteeName: req.name,
        inviteeEmail: req.email,
        inviteeTimezone: req.timezone,
        start: new Date(slot.start).toISOString(),
        end: new Date(slot.end).toISOString(),
        status: 'confirmed',
        answers: req.answers,
        meetingUrl: ctx.eventType.location.kind === 'google_meet' ? `https://meet.google.com/demo-${Math.random().toString(36).slice(2, 8)}` : ctx.eventType.location.value,
        fairnessScore: slotBadges(ctx, slot, req.timezone).fairness,
        createdAt: new Date().toISOString(),
    };
    dispatch(ws.saveBooking(booking));
    return { booking: { id: booking.id, start: booking.start, end: booking.end, meetingUrl: booking.meetingUrl ?? null, fairness: booking.fairnessScore }, manageUrl: `/booking/${booking.id}?token=demo` };
}

export interface ManagedBooking {
    booking: { id: string; eventType: { title: string; slug: string }; invitee: { name: string; email: string; timezone: string }; start: string; end: string; status: string; meetingUrl: string | null };
    host: { name: string; username: string };
}

export async function fetchManagedBooking(id: string, token: string): Promise<ManagedBooking> {
    if (token !== 'demo') return callFunction<ManagedBooking>('manage-booking', undefined, { method: 'GET', query: { token } });
    const w = store.getState().workspace;
    const b = w.bookings.find((x) => x.id === id);
    const et = w.eventTypes.find((e) => e.id === b?.eventTypeId);
    if (!b || !et || !w.me) throw new Error('Booking not found');
    return {
        booking: { id: b.id, eventType: { title: et.title, slug: et.slug }, invitee: { name: b.inviteeName, email: b.inviteeEmail, timezone: b.inviteeTimezone }, start: b.start, end: b.end, status: b.status, meetingUrl: b.meetingUrl ?? null },
        host: { name: w.me.name, username: w.me.username },
    };
}

export async function manageBooking(id: string, token: string, action: 'cancel' | 'reschedule', newStart?: string, reason?: string): Promise<void> {
    if (token !== 'demo') {
        await callFunction('manage-booking', { token, action, newStart, reason });
        return;
    }
    const b = store.getState().workspace.bookings.find((x) => x.id === id);
    if (!b) throw new Error('Booking not found');
    if (action === 'cancel') {
        dispatch(ws.saveBooking({ ...b, status: 'cancelled' }));
        return;
    }
    if (!newStart) throw new Error('Pick a new time');
    const duration = Date.parse(b.end) - Date.parse(b.start);
    dispatch(ws.saveBooking({ ...b, status: 'rescheduled' }));
    dispatch(ws.saveBooking({ ...b, id: newId(), start: newStart, end: new Date(Date.parse(newStart) + duration).toISOString(), status: 'confirmed', createdAt: new Date().toISOString() }));
}
