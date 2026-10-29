// Scheduled job (call every 5 minutes from pg_cron / Supabase scheduled functions with
// header `x-cron-secret: $CRON_SECRET`). Sends due reminders and follow-ups, marks past meetings
// completed, and refreshes calendar busy time for connected users.
import { DateTime } from 'luxon';
import { syncBusy } from '../_shared/calendar.ts';
import { manageUrl } from '../_shared/emails.ts';
import { HttpError, env, handler, json, serviceClient } from '../_shared/http.ts';
import { escapeHtml, sendEmail, sendPush } from '../_shared/notify.ts';

Deno.serve(
    handler(async (req) => {
        if (req.headers.get('x-cron-secret') !== env('CRON_SECRET')) throw new HttpError(401, 'Unauthorized');
        const db = serviceClient();
        const now = new Date();

        const { data: due } = await db
            .from('reminders')
            .select('id, kind, channel, bookings(id, host_id, invitee_name, invitee_email, invitee_timezone, start_at, status, meeting_url, event_types(title))')
            .is('sent_at', null)
            .lte('send_at', now.toISOString())
            .limit(200);

        let sent = 0;
        // deno-lint-ignore no-explicit-any
        for (const r of (due ?? []) as any[]) {
            const b = r.bookings;
            try {
                if (!b || (b.status !== 'confirmed' && r.kind === 'reminder')) {
                    await db.from('reminders').update({ sent_at: now.toISOString(), error: 'skipped: not confirmed' }).eq('id', r.id);
                    continue;
                }
                const title = b.event_types?.title ?? 'Meeting';
                const when = DateTime.fromISO(b.start_at, { zone: b.invitee_timezone }).toFormat("cccc 'at' h:mm a ZZZZ");
                if (r.kind === 'follow_up') {
                    if (b.status === 'confirmed' || b.status === 'completed') {
                        await sendEmail({
                            to: b.invitee_email,
                            subject: `Thanks for meeting — ${title}`,
                            html: `<p>Thanks for your time, ${escapeHtml(b.invitee_name)}. Need another slot? <a href="${escapeHtml(await manageUrl(b.id))}">Manage your booking</a>.</p>`,
                        });
                    }
                } else if (r.channel === 'email') {
                    await sendEmail({
                        to: b.invitee_email,
                        subject: `Reminder: ${title} ${when}`,
                        html: `<p>${escapeHtml(title)} — ${escapeHtml(when)}.</p>${b.meeting_url ? `<p><a href="${escapeHtml(b.meeting_url)}">Join</a></p>` : ''}<p><a href="${escapeHtml(await manageUrl(b.id))}">Reschedule or cancel</a></p>`,
                    });
                } else {
                    const { data: tokens } = await db.from('push_tokens').select('token').eq('user_id', b.host_id);
                    await sendPush((tokens ?? []).map((t: { token: string }) => t.token), `Up next: ${title}`, `${b.invitee_name} · ${when}`, { bookingId: b.id });
                }
                await db.from('reminders').update({ sent_at: now.toISOString() }).eq('id', r.id);
                sent++;
            } catch (err) {
                await db.from('reminders').update({ error: String(err).slice(0, 500) }).eq('id', r.id);
            }
        }

        // Meetings that ended over an hour ago become 'completed' (hosts can still mark no-shows).
        await db.from('bookings').update({ status: 'completed' }).eq('status', 'confirmed').lt('end_at', new Date(now.getTime() - 3_600_000).toISOString());

        // Refresh busy time for calendars not synced in the last 15 minutes.
        const { data: stale } = await db
            .from('calendar_connections')
            .select('user_id')
            .or(`last_synced_at.is.null,last_synced_at.lt.${new Date(now.getTime() - 15 * 60_000).toISOString()}`)
            .limit(25);
        for (const userId of new Set((stale ?? []).map((s: { user_id: string }) => s.user_id))) {
            try {
                await syncBusy(db, userId, now, new Date(now.getTime() + 60 * 86_400_000));
            } catch (err) {
                console.error('busy sync failed', userId, err);
            }
        }
        return json({ sent });
    }),
);
