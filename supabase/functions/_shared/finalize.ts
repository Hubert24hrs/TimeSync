import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_REMINDER_POLICY, planReminders, type EventType } from '../../../src/engine/index.ts';
import { createCalendarEvents, updateCalendarEvents } from './calendar.ts';
import { notifyBooking, type BookingRow } from './emails.ts';
import { dispatchWebhooks } from './notify.ts';

/** After a booking row exists: calendar write + video link, reminders, emails, webhooks. */
export async function finalizeBooking(db: SupabaseClient, booking: BookingRow, eventType: EventType, kind: 'created' | 'rescheduled') {
    const video = eventType.location.kind === 'google_meet';
    const staticLocation = eventType.location.kind === 'zoom' || eventType.location.kind === 'custom' ? eventType.location.value : undefined;
    let ids = booking.external_event_ids ?? {};
    let meetingUrl = booking.meeting_url ?? undefined;
    if (kind === 'rescheduled' && Object.keys(ids).length > 0) {
        // Move the existing calendar events so attendees keep the same invite and video link.
        await updateCalendarEvents(db, ids, { start: booking.start_at, end: booking.end_at });
    } else {
        const created = await createCalendarEvents(db, booking.host_id, {
            requestId: booking.id,
            title: `${eventType.title} — ${booking.invitee_name}`,
            description: `Booked with TimeSync.\nInvitee:${booking.invitee_name} <${booking.invitee_email}> (${booking.invitee_timezone})`,
            start: booking.start_at,
            end: booking.end_at,
            attendees: [{ email: booking.invitee_email, name: booking.invitee_name }],
            video,
            location: eventType.location.kind === 'in_person' || eventType.location.kind === 'phone' ? eventType.location.value : undefined,
        });
        ids = created.ids;
        meetingUrl = created.meetingUrl;
    }
    const updated: BookingRow = { ...booking, meeting_url: meetingUrl ?? staticLocation ?? null, external_event_ids: ids };
    await db.from('bookings').update({ meeting_url: updated.meeting_url, external_event_ids: ids }).eq('id', booking.id);

    await db.from('reminders').delete().eq('booking_id', booking.id).is('sent_at', null);
    const reminders = planReminders({ id: booking.id, start: booking.start_at, end: booking.end_at, status: 'confirmed' }, DEFAULT_REMINDER_POLICY, Date.now());
    if (reminders.length) {
        await db.from('reminders').insert(reminders.map((r) => ({ booking_id: r.bookingId, kind: r.kind, channel: r.channel, send_at: new Date(r.sendAt).toISOString() })));
    }

    await Promise.allSettled([
        notifyBooking(db, updated, kind, eventType.title),
        dispatchWebhooks(db, eventType.ownerId, kind === 'created' ? 'booking.created' : 'booking.rescheduled', publicBooking(updated, eventType)),
    ]);
    return updated;
}

export function publicBooking(b: BookingRow, et: Pick<EventType, 'title' | 'slug'>) {
    return {
        id: b.id,
        eventType: { title: et.title, slug: et.slug },
        invitee: { name: b.invitee_name, email: b.invitee_email, timezone: b.invitee_timezone },
        start: b.start_at,
        end: b.end_at,
        status: b.status,
        meetingUrl: b.meeting_url,
    };
}
