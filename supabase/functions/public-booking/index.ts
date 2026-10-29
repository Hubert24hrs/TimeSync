// Public, no-login booking API behind timesync.app/<user>/<event>.
//   GET  ?username=&event=&from=&to=&tz=   → event details + slots in the invitee's zone with badges
//   POST { username, eventSlug, start, name, email, timezone, answers } → creates a booking
import { groupByDay, isValidTimeZone, bookingRequestSchema } from '../../../src/engine/index.ts';
import { bookableSlots, chooseHost, loadEventContext, slotBadges } from '../_shared/booking.ts';
import { manageUrl, type BookingRow } from '../_shared/emails.ts';
import { finalizeBooking } from '../_shared/finalize.ts';
import { HttpError, handler, ipKey, json, rateLimit, readJson, serviceClient } from '../_shared/http.ts';

const DAY = 86_400_000;

Deno.serve(
    handler(async (req) => {
        const db = serviceClient();
        if (req.method === 'GET') {
            await rateLimit(db, await ipKey(req, 'slots'), 60, 120);
            const url = new URL(req.url);
            const username = url.searchParams.get('username') ?? '';
            const slug = url.searchParams.get('event') ?? '';
            const tz = url.searchParams.get('tz') ?? 'UTC';
            if (!isValidTimeZone(tz)) throw new HttpError(400, 'Unknown time zone');
            const now = Date.now();
            const from = Math.max(now, Date.parse(url.searchParams.get('from') ?? '') || now);
            const to = Math.min(from + 31 * DAY, Date.parse(url.searchParams.get('to') ?? '') || from + 14 * DAY);

            const ctx = await loadEventContext(db, username, slug, from, to);
            const slots = bookableSlots(ctx, from, to, now);
            const badges = new Map(slots.map((s) => [s.start, slotBadges(ctx, s, tz)]));
            const et = ctx.eventType;
            return json({
                host: { name: ctx.owner.name, username: ctx.owner.username, avatarUrl: ctx.owner.avatarUrl, timezone: ctx.owner.timezone },
                eventType: {
                    title: et.title,
                    slug: et.slug,
                    description: et.description,
                    kind: et.kind,
                    durationMinutes: et.durationMinutes,
                    location: et.location.kind,
                    color: et.color,
                    questions: et.questions,
                    hosts: ctx.hosts.map((h) => ({ name: h.participant.name, timezone: h.participant.timezone })),
                },
                timezone: tz,
                days: groupByDay(slots, tz).map((d) => ({
                    ...d,
                    slots: d.slots.map((s) => ({
                        start: new Date(s.start).toISOString(),
                        label: s.label,
                        ...badges.get(s.start),
                        seatsLeft: slots.find((x) => x.start === s.start)?.seatsLeft,
                    })),
                })),
            });
        }

        if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
        await rateLimit(db, await ipKey(req, 'book'), 600, 10);
        const parsed = bookingRequestSchema.safeParse(await readJson(req));
        if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid booking');
        const input = parsed.data;
        const start = Date.parse(input.start);

        const ctx = await loadEventContext(db, input.username, input.eventSlug, start - DAY, start + DAY);
        const missing = ctx.eventType.questions.find((q) => q.required && !input.answers[q.id]?.trim());
        if (missing) throw new HttpError(400, `Please answer: ${missing.label}`);
        const allowed = new Set(ctx.eventType.questions.map((q) => q.id));
        const answers = Object.fromEntries(Object.entries(input.answers).filter(([k]) => allowed.has(k)));

        const slot = bookableSlots(ctx, start - DAY, start + DAY, Date.now()).find((s) => s.start === start);
        if (!slot) throw new HttpError(409, 'That time is no longer available');
        const hostId = chooseHost(ctx, slot);
        const badges = slotBadges(ctx, slot, input.timezone);

        const { data: booking, error } = await db
            .from('bookings')
            .insert({
                event_type_id: ctx.eventType.id,
                host_id: hostId,
                invitee_name: input.name,
                invitee_email: input.email.toLowerCase(),
                invitee_timezone: input.timezone,
                start_at: new Date(slot.start).toISOString(),
                end_at: new Date(slot.end).toISOString(),
                is_group: ctx.eventType.kind === 'group',
                answers,
                fairness_score: badges.fairness,
            })
            .select('*')
            .single();
        if (error) {
            if (error.code === '23P01') throw new HttpError(409, 'That time was just taken');
            throw error;
        }

        const finalized = await finalizeBooking(db, booking as BookingRow, ctx.eventType, 'created');
        return json(
            {
                booking: { id: finalized.id, start: finalized.start_at, end: finalized.end_at, meetingUrl: finalized.meeting_url, fairness: badges.fairness },
                manageUrl: await manageUrl(finalized.id),
            },
            201,
        );
    }),
);
