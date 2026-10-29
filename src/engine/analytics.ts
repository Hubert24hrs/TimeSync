import { DateTime } from 'luxon';
import { participantSlot } from './optimizer.ts';
import type { Booking, Participant } from './types.ts';

export interface SchedulingAnalytics {
    meetingsBooked: number;
    cancelled: number;
    noShows: number;
    averageFairness: number | null;
    /** Minutes spent in meetings outside working hours, per participant id. */
    afterHoursMinutes: Record<string, number>;
    /** Booked meetings per ISO week ('2026-W44'), oldest first. */
    perWeek: { week: string; count: number }[];
}

export function computeAnalytics(bookings: Booking[], people: Participant[]): SchedulingAnalytics {
    const live = bookings.filter((b) => b.status !== 'cancelled');
    const fairness = live.map((b) => b.fairnessScore).filter((f): f is number => typeof f === 'number');
    const afterHoursMinutes: Record<string, number> = {};
    for (const p of people) afterHoursMinutes[p.id] = 0;

    for (const b of live) {
        const slot = { start: Date.parse(b.start), end: Date.parse(b.end) };
        const minutes = (slot.end - slot.start) / 60_000;
        for (const p of people) {
            if (p.id !== b.hostId) continue;
            if (participantSlot(p, slot).band !== 'ideal') afterHoursMinutes[p.id] += minutes;
        }
    }

    const weeks = new Map<string, number>();
    for (const b of live) {
        const week = DateTime.fromISO(b.start, { zone: 'utc' }).toFormat("kkkk-'W'WW");
        weeks.set(week, (weeks.get(week) ?? 0) + 1);
    }

    return {
        meetingsBooked: live.length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
        noShows: bookings.filter((b) => b.status === 'no_show').length,
        averageFairness: fairness.length ? Math.round(fairness.reduce((a, b) => a + b, 0) / fairness.length) : null,
        afterHoursMinutes,
        perWeek: [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count })),
    };
}
