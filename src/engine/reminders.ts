import { MINUTE } from './time.ts';
import type { Booking } from './types.ts';

export type ReminderChannel = 'email' | 'push';

export interface ReminderPolicy {
    /** Minutes before start, e.g. [1440, 60]. */
    beforeMinutes: number[];
    channels: ReminderChannel[];
    /** Minutes after end to send a follow-up; omit to disable. */
    followUpAfterMinutes?: number;
}

export interface PlannedReminder {
    bookingId: string;
    kind: 'reminder' | 'follow_up';
    channel: ReminderChannel;
    sendAt: number;
}

export const DEFAULT_REMINDER_POLICY: ReminderPolicy = { beforeMinutes: [24 * 60, 60], channels: ['email', 'push'], followUpAfterMinutes: 30 };

/** Reminders still due for a booking; skips ones already in the past at booking time. */
export function planReminders(booking: Pick<Booking, 'id' | 'start' | 'end' | 'status'>, policy: ReminderPolicy, now: number): PlannedReminder[] {
    if (booking.status !== 'confirmed') return [];
    const start = Date.parse(booking.start);
    const end = Date.parse(booking.end);
    const out: PlannedReminder[] = [];
    for (const minutes of policy.beforeMinutes) {
        const sendAt = start - minutes * MINUTE;
        if (sendAt <= now) continue;
        for (const channel of policy.channels) out.push({ bookingId: booking.id, kind: 'reminder', channel, sendAt });
    }
    if (policy.followUpAfterMinutes !== undefined) {
        out.push({ bookingId: booking.id, kind: 'follow_up', channel: 'email', sendAt: end + policy.followUpAfterMinutes * MINUTE });
    }
    return out.sort((a, b) => a.sendAt - b.sendAt);
}

/** A host can mark a no-show from the meeting start until 7 days after it ends. */
export function canMarkNoShow(booking: Pick<Booking, 'start' | 'end' | 'status'>, now: number): boolean {
    if (booking.status !== 'confirmed' && booking.status !== 'completed') return false;
    return now >= Date.parse(booking.start) && now <= Date.parse(booking.end) + 7 * 24 * 60 * MINUTE;
}
