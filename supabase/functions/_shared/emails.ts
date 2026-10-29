import type { SupabaseClient } from '@supabase/supabase-js';
import { DateTime } from 'luxon';
import { buildIcs } from '../../../src/engine/index.ts';
import { signLink } from '../../../src/engine/signedLinks.ts';
import { env } from './http.ts';
import { escapeHtml, sendEmail, sendPush } from './notify.ts';

export interface BookingRow {
    id: string;
    event_type_id: string;
    host_id: string;
    invitee_name: string;
    invitee_email: string;
    invitee_timezone: string;
    start_at: string;
    end_at: string;
    status: string;
    meeting_url: string | null;
    external_event_ids: Record<string, string>;
}

const MANAGE_LINK_DAYS = 120;

export async function manageUrl(bookingId: string): Promise<string> {
    const token = await signLink({ sub: bookingId, action: 'manage', exp: Math.floor(Date.now() / 1000) + MANAGE_LINK_DAYS * 86_400 }, env('LINK_SIGNING_SECRET'));
    return `${env('PUBLIC_ORIGIN')}/booking/${bookingId}?token=${encodeURIComponent(token)}`;
}

export function bookingIcs(b: BookingRow, title: string, host: { name: string; email: string }, status: 'CONFIRMED' | 'CANCELLED' = 'CONFIRMED', sequence = 0): string {
    return buildIcs([
        {
            uid: `${b.id}@timesync.app`,
            title,
            start: Date.parse(b.start_at),
            end: Date.parse(b.end_at),
            location: b.meeting_url ?? undefined,
            url: b.meeting_url ?? undefined,
            organizer: host,
            attendees: [{ name: b.invitee_name, email: b.invitee_email }],
            status,
            sequence,
        },
    ]);
}

function when(iso: string, zone: string): string {
    return DateTime.fromISO(iso, { zone }).toFormat("cccc, LLLL d 'at' h:mm a ZZZZ");
}

/** Confirmation / update / cancellation to invitee (with manage link + .ics) and host (email + push). */
export async function notifyBooking(db: SupabaseClient, b: BookingRow, kind: 'created' | 'rescheduled' | 'cancelled', title: string) {
    const { data: hostProfile } = await db.from('profiles').select('display_name, username, timezone').eq('id', b.host_id).single();
    const { data: hostUser } = await db.auth.admin.getUserById(b.host_id);
    const host = { name: hostProfile?.display_name || hostProfile?.username || 'Your host', email: hostUser.user?.email ?? 'host@timesync.app' };
    const link = await manageUrl(b.id);
    const verb = kind === 'created' ? 'Confirmed' : kind === 'rescheduled' ? 'Rescheduled' : 'Cancelled';
    const ics = bookingIcs(b, title, host, kind === 'cancelled' ? 'CANCELLED' : 'CONFIRMED', kind === 'created' ? 0 : 1);
    const safeTitle = escapeHtml(title);

    const tasks: Promise<unknown>[] = [
        sendEmail({
            to: b.invitee_email,
            subject: `${verb}: ${title} with ${host.name}`,
            html: `<p>Hi ${escapeHtml(b.invitee_name)},</p>
<p><strong>${safeTitle}</strong> with ${escapeHtml(host.name)} — ${escapeHtml(when(b.start_at, b.invitee_timezone))}.</p>
${b.meeting_url && kind !== 'cancelled' ? `<p>Join: <a href="${escapeHtml(b.meeting_url)}">${escapeHtml(b.meeting_url)}</a></p>` : ''}
${kind !== 'cancelled' ? `<p><a href="${escapeHtml(link)}">Reschedule or cancel</a></p>` : ''}`,
            ics,
        }),
        sendEmail({
            to: host.email,
            subject: `${verb}: ${title} with ${b.invitee_name}`,
            html: `<p><strong>${safeTitle}</strong> with ${escapeHtml(b.invitee_name)} (${escapeHtml(b.invitee_email)}) — ${escapeHtml(when(b.start_at, hostProfile?.timezone ?? 'UTC'))}.</p>`,
            ics,
        }),
    ];
    const { data: tokens } = await db.from('push_tokens').select('token').eq('user_id', b.host_id);
    tasks.push(sendPush((tokens ?? []).map((t: { token: string }) => t.token), `${verb}: ${title}`, `${b.invitee_name} · ${when(b.start_at, hostProfile?.timezone ?? 'UTC')}`, { bookingId: b.id }));
    const results = await Promise.allSettled(tasks);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error('notify failed', (r as PromiseRejectedResult).reason));
}
