import { DateTime } from 'luxon';
import { MINUTE, datesBetween, localDate, mergeIntervals, overlaps, rangesToIntervals } from './time.ts';
import type { AvailabilitySchedule, EventTypeRules, Interval, TimeRange, Weekday } from './types.ts';

export interface SlotQuery {
    schedule: AvailabilitySchedule;
    rules: EventTypeRules;
    from: number;
    to: number;
    now: number;
    /** Calendar events and other bookings that block time. Buffers are applied around them. */
    busy?: Interval[];
    /** Existing bookings of this event type, for the daily cap. */
    bookingsOfType?: Interval[];
}

/** Ranges that apply on a date: a date override wins over the weekly pattern. */
export function rangesForDate(schedule: AvailabilitySchedule, date: string): TimeRange[] {
    const override = schedule.overrides.find((o) => o.date === date);
    if (override) return override.ranges;
    const weekday = DateTime.fromISO(date, { zone: schedule.timezone }).weekday as Weekday;
    return schedule.weekly[weekday] ?? [];
}

/** Open windows (UTC) of a schedule within [from, to). */
export function openWindows(schedule: AvailabilitySchedule, from: number, to: number): Interval[] {
    const windows: Interval[] = [];
    for (const date of datesBetween(from, to, schedule.timezone)) {
        windows.push(...rangesToIntervals(date, rangesForDate(schedule, date), schedule.timezone));
    }
    return mergeIntervals(windows)
        .map((w) => ({ start: Math.max(w.start, from), end: Math.min(w.end, to) }))
        .filter((w) => w.end > w.start);
}

/**
 * Bookable start times for an event type: inside open windows, after minimum notice, within the
 * rolling window, not colliding with busy time once buffers are applied, and under the daily cap.
 */
export function availableSlots(query: SlotQuery): Interval[] {
    const { schedule, rules, now } = query;
    const duration = rules.durationMinutes * MINUTE;
    const step = (rules.slotIntervalMinutes ?? rules.durationMinutes) * MINUTE;
    const before = rules.bufferBeforeMinutes * MINUTE;
    const after = rules.bufferAfterMinutes * MINUTE;
    const earliest = now + rules.minimumNoticeMinutes * MINUTE;
    const latest = rules.rollingWindowDays ? now + rules.rollingWindowDays * 24 * 60 * MINUTE : Infinity;
    const to = Math.min(query.to, latest);
    if (duration <= 0 || step <= 0) throw new Error('Duration and slot interval must be positive');

    // Busy time grows by our buffers on both sides, so a new meeting keeps its own buffer clear.
    const blocked = mergeIntervals((query.busy ?? []).map((b) => ({ start: b.start - after, end: b.end + before })));

    const perDay = new Map<string, number>();
    for (const b of query.bookingsOfType ?? []) {
        const d = localDate(b.start, schedule.timezone);
        perDay.set(d, (perDay.get(d) ?? 0) + 1);
    }

    const slots: Interval[] = [];
    for (const window of openWindows(schedule, query.from, to)) {
        // Start times align to the window start (e.g. :00 and :30), like Calendly.
        for (let start = window.start; start + duration <= window.end; start += step) {
            if (start < earliest) continue;
            const slot = { start, end: start + duration };
            if (blocked.some((b) => overlaps(b, slot))) continue;
            if (rules.maxPerDay !== undefined) {
                const count = perDay.get(localDate(start, schedule.timezone)) ?? 0;
                if (count >= rules.maxPerDay) continue;
            }
            slots.push(slot);
        }
    }
    return slots;
}

/** Slots where every host is free (collective events). */
export function intersectSlots(perHost: Interval[][]): Interval[] {
    if (perHost.length === 0) return [];
    const [first, ...rest] = perHost;
    return first.filter((s) => rest.every((host) => host.some((h) => h.start === s.start && h.end === s.end)));
}

/** Slots where at least one host is free (round-robin), with the hosts free at each. */
export function unionSlots(perHost: { hostId: string; slots: Interval[] }[]): (Interval & { hostIds: string[] })[] {
    const byStart = new Map<number, Interval & { hostIds: string[] }>();
    for (const { hostId, slots } of perHost) {
        for (const s of slots) {
            const existing = byStart.get(s.start);
            if (existing) existing.hostIds.push(hostId);
            else byStart.set(s.start, { ...s, hostIds: [hostId] });
        }
    }
    return [...byStart.values()].sort((a, b) => a.start - b.start);
}

export interface DaySlots {
    date: string; // yyyy-MM-dd in the invitee zone
    label: string; // 'Tue, Nov 3'
    slots: (Interval & { label: string })[];
}

/** Groups slots by the invitee's local date, with labels in the invitee's zone. */
export function groupByDay(slots: Interval[], zone: string, hour12 = true): DaySlots[] {
    const days = new Map<string, DaySlots>();
    for (const s of slots) {
        const dt = DateTime.fromMillis(s.start, { zone });
        const date = dt.toISODate() ?? '';
        if (!days.has(date)) days.set(date, { date, label: dt.toFormat('ccc, LLL d'), slots: [] });
        days.get(date)!.slots.push({ ...s, label: dt.toFormat(hour12 ? 'h:mm a' : 'HH:mm') });
    }
    return [...days.values()];
}

export function defaultWeeklyHours(start = '09:00', end = '17:00', days: Weekday[] = [1, 2, 3, 4, 5]): AvailabilitySchedule['weekly'] {
    const weekly: AvailabilitySchedule['weekly'] = {};
    for (const d of days) weekly[d] = [{ start, end }];
    return weekly;
}
