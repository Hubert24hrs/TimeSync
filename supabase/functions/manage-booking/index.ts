// Emailed manage links (no login): view, download .ics, reschedule or cancel a booking.
//   GET  ?token=…[&format=ics]
//   POST { token, action: 'cancel' | 'reschedule', newStart?, reason? }
import { manageBookingSchema } from '../../../src/engine/index.ts';
import { verifyLink } from '../../../src/engine/signedLinks.ts';
import { bookableSlots, loadEventContext } from '../_shared/booking.ts';
import { updateCalendarEvents } from '../_shared/calendar.ts';
import { bookingIcs, notifyBooking, type BookingRow } from '../_shared/emails.ts';
import { finalizeBooking, publicBooking } from '../_shared/finalize.ts';
import { HttpError, corsHeaders, env, handler, ipKey, json, rateLimit, readJson, serviceClient } from '../_shared/http.ts';
import { dispatchWebhooks } from '../_shared/notify.ts';

const DAY = 86_400_000;

Deno.serve(
    handler(async (req) => {
        const db = serviceClient();
        await rateLimit(db, await ipKey(req, 'manage'), 600, 60);

        const body = req.method === 'POST' ? await readJson(req) : null;
        const token = req.method === 'GET' ? (new URL(req.url).searchParams.get('token') ?? '') : String((body as { token?: unknown })?.token ?? '');
        const claims = await verifyLink(token, env('LINK_SIGNING_SECRET'));
        if (!claims || claims.action !== 'manage') throw new HttpError(401, 'This link is invalid or has expired');

        const { data: row } = await db.from('bookings').select('*, event_types(*), profiles!bookings_host_id_fkey(username, display_name, timezone)').eq('id', claims.sub).maybeSingle();
        if (!row) throw new HttpError(404, 'Booking not found');
        const booking = row as BookingRow & { event_types: Record<string, unknown>; profiles: { username: string; display_name: string; timezone: string } };
        const et = booking.event_types as { title: string; slug: string; owner_id: string };

        if (req.method === 'GET') {
            if (new URL(req.url).searchParams.get('format') === 'ics') {
                const ics = bookingIcs(booking, et.title, { name: booking.profiles.display_name || booking.profiles.username, email: 'noreply@timesync.app' });
                return new Response(ics, { headers: { ...corsHeaders, 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="meeting.ics"' } });
            }
            return json({ booking: publicBooking(booking, et), host: { name: booking.profiles.display_name || booking.profiles.username, username: booking.profiles.username } });
        }

        const parsed = manageBookingSchema.safeParse(body);
        if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid request');
        if (booking.status !== 'confirmed') throw new HttpError(409, `This booking is already ${booking.status}`);
        if (Date.parse(booking.start_at) < Date.now()) throw new HttpError(409, 'This meeting has already started');

        if (parsed.data.action === 'cancel') {
            await db.from('bookings').update({ status: 'cancelled', cancel_reason: parsed.data.reason ?? null }).eq('id', booking.id);
            await db.from('reminders').delete().eq('booking_id', booking.id).is('sent_at', null);
            await updateCalendarEvents(db, booking.external_event_ids ?? {}, 'delete');
            const cancelled = { ...booking, status: 'cancelled' };
            await Promise.allSettled([
                notifyBooking(db, cancelled, 'cancelled', et.title),
                dispatchWebhooks(db, et.owner_id, 'booking.cancelled', { ...publicBooking(cancelled, et), reason: parsed.data.reason }),
            ]);
            return json({ ok: true, status: 'cancelled' });
        }

        if (!parsed.data.newStart) throw new HttpError(400, 'Pick a new time');
        const newStart = Date.parse(parsed.data.newStart);
        const ctx = await loadEventContext(db, booking.profiles.username, et.slug, newStart - DAY, newStart + DAY);
        // The booking being moved must not block its own new time.
        const old = { start: Date.parse(booking.start_at), end: Date.parse(booking.end_at) };
        for (const h of ctx.hosts) h.busy = h.busy.filter((b) => !(b.start === old.start && b.end === old.end && h.participant.id === booking.host_id));
        const slot = bookableSlots(ctx, newStart - DAY, newStart + DAY, Date.now()).find((s) => s.start === newStart && s.hostIds.includes(booking.host_id));
        if (!slot) throw new HttpError(409, 'That time is not available');

        await db.from('bookings').update({ status: 'rescheduled' }).eq('id', booking.id);
        const { data: moved, error } = await db
            .from('bookings')
            .insert({
                event_type_id: booking.event_type_id,
                host_id: booking.host_id,
                invitee_name: booking.invitee_name,
                invitee_email: booking.invitee_email,
                invitee_timezone: booking.invitee_timezone,
                start_at: new Date(slot.start).toISOString(),
                end_at: new Date(slot.end).toISOString(),
                is_group: ctx.eventType.kind === 'group',
                answers: (row as { answers: unknown }).answers,
                meeting_url: booking.meeting_url,
                external_event_ids: booking.external_event_ids,
                rescheduled_from: booking.id,
            })
            .select('*')
            .single();
        if (error) {
            await db.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);
            if (error.code === '23P01') throw new HttpError(409, 'That time was just taken');
            throw error;
        }
        await db.from('reminders').delete().eq('booking_id', booking.id).is('sent_at', null);
        const finalized = await finalizeBooking(db, moved as BookingRow, ctx.eventType, 'rescheduled');
        return json({ ok: true, status: 'rescheduled', booking: publicBooking(finalized, et) });
    }),
);
