import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventContext as EngineEventContext, EventType, HostContext, Participant } from '../../../src/engine/index.ts';
import { HttpError } from './http.ts';

// Loads everything needed to compute bookable slots for one public event type.
// The slot maths itself lives in the shared engine (src/engine/booking.ts).
export { bookableSlots, chooseHost, slotBadges, type BookableSlot } from '../../../src/engine/index.ts';

export interface EventContext extends EngineEventContext {
    owner: { id: string; username: string; name: string; avatarUrl: string | null; timezone: string };
}

interface ProfileRow {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    timezone: string;
    chronotype: Participant['chronotype'];
    country_code: string | null;
    working_start: number;
    working_end: number;
}

function toParticipant(p: ProfileRow): Participant {
    return {
        id: p.id,
        name: p.display_name || p.username,
        timezone: p.timezone,
        chronotype: p.chronotype,
        countryCode: p.country_code ?? undefined,
        workingHours: { start: Number(p.working_start), end: Number(p.working_end) },
    };
}

// deno-lint-ignore no-explicit-any
export function toEventType(row: any, hostIds: string[]): EventType {
    return {
        id: row.id,
        ownerId: row.owner_id,
        slug: row.slug,
        title: row.title,
        description: row.description ?? undefined,
        kind: row.kind,
        durationMinutes: row.duration_minutes,
        slotIntervalMinutes: row.slot_interval_minutes ?? undefined,
        bufferBeforeMinutes: row.buffer_before_minutes,
        bufferAfterMinutes: row.buffer_after_minutes,
        minimumNoticeMinutes: row.minimum_notice_minutes,
        maxPerDay: row.max_per_day ?? undefined,
        rollingWindowDays: row.rolling_window_days ?? undefined,
        seats: row.seats ?? undefined,
        location: row.location,
        color: row.color,
        scheduleId: row.schedule_id,
        hostIds,
        questions: row.questions ?? [],
        active: row.active,
    };
}

export async function loadEventContext(db: SupabaseClient, username: string, slug: string, from: number, to: number): Promise<EventContext> {
    const { data: owner } = await db.from('profiles').select('*').eq('username', username).maybeSingle();
    if (!owner) throw new HttpError(404, 'Booking page not found');
    const { data: et } = await db.from('event_types').select('*').eq('owner_id', owner.id).eq('slug', slug).eq('active', true).maybeSingle();
    if (!et) throw new HttpError(404, 'Booking page not found');

    const { data: hostRows } = await db.from('event_type_hosts').select('user_id, priority, weight').eq('event_type_id', et.id);
    const hostIds: string[] = hostRows?.length ? hostRows.map((h: { user_id: string }) => h.user_id) : [owner.id];
    const { data: profiles } = await db.from('profiles').select('*').in('id', hostIds);
    const fromIso = new Date(from - 86_400_000).toISOString();
    const toIso = new Date(to + 86_400_000).toISOString();

    const hosts: HostContext[] = [];
    for (const p of (profiles ?? []) as ProfileRow[]) {
        const scheduleQuery = db.from('schedules').select('*').eq('owner_id', p.id);
        const { data: sched } = await (p.id === owner.id && et.schedule_id ? scheduleQuery.eq('id', et.schedule_id) : scheduleQuery.eq('is_default', true)).maybeSingle();
        if (!sched) continue;
        const [{ data: busy }, { data: bookings }] = await Promise.all([
            db.from('busy_blocks').select('start_at, end_at').eq('user_id', p.id).lt('start_at', toIso).gt('end_at', fromIso),
            db.from('bookings').select('event_type_id, start_at, end_at, is_group').eq('host_id', p.id).eq('status', 'confirmed').lt('start_at', toIso).gt('end_at', fromIso),
        ]);
        const toInterval = (r: { start_at: string; end_at: string }) => ({ start: Date.parse(r.start_at), end: Date.parse(r.end_at) });
        const ofType = (bookings ?? []).filter((b: { event_type_id: string }) => b.event_type_id === et.id);
        // Group-event seats don't block each other; everything else is busy time.
        const blocking = (bookings ?? []).filter((b: { event_type_id: string; is_group: boolean }) => !(b.is_group && b.event_type_id === et.id));
        hosts.push({
            participant: toParticipant(p),
            schedule: { id: sched.id, name: sched.name, timezone: sched.timezone, weekly: sched.weekly, overrides: sched.overrides },
            busy: [...(busy ?? []).map(toInterval), ...blocking.map(toInterval)],
            bookingsOfType: ofType.map(toInterval),
            load: ofType.length,
        });
    }
    if (hosts.length === 0) throw new HttpError(404, 'This event has no available hosts');

    return {
        owner: { id: owner.id, username: owner.username, name: owner.display_name || owner.username, avatarUrl: owner.avatar_url, timezone: owner.timezone },
        eventType: toEventType(et, hostIds),
        hosts,
    };
}

