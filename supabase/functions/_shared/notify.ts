import type { SupabaseClient } from '@supabase/supabase-js';
import { hmacHex } from './http.ts';

// Outbound side effects: email, push and webhooks. Each is best-effort and never blocks a booking.

export interface Email {
    to: string;
    subject: string;
    html: string;
    ics?: string;
}

/** Sends through Resend when RESEND_API_KEY is set; otherwise logs (dev / not yet configured). */
export async function sendEmail(email: Email): Promise<void> {
    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) {
        console.log(`[email:not-configured] to=${email.to} subject="${email.subject}"`);
        return;
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: Deno.env.get('EMAIL_FROM') ?? 'TimeSync <bookings@timesync.app>',
            to: [email.to],
            subject: email.subject,
            html: email.html,
            attachments: email.ics ? [{ filename: 'invite.ics', content: btoa(unescape(encodeURIComponent(email.ics))) }] : undefined,
        }),
    });
    if (!res.ok) throw new Error(`Email failed: ${res.status}`);
}

/** Expo push service (free, no key required for basic sends). */
export async function sendPush(tokens: string[], title: string, body: string, data: Record<string, string> = {}): Promise<void> {
    if (tokens.length === 0) return;
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokens.map((to) => ({ to, title, body, data, sound: 'default' }))),
    });
    if (!res.ok) throw new Error(`Push failed: ${res.status}`);
}

export type WebhookEvent = 'booking.created' | 'booking.cancelled' | 'booking.rescheduled' | 'poll.booked';

/**
 * POSTs to the owner's webhooks (works with Zapier/Make "catch hook" URLs).
 * Receivers verify `X-TimeSync-Signature: sha256=<hmac(secret, timestamp.body)>`.
 */
export async function dispatchWebhooks(db: SupabaseClient, ownerId: string, event: WebhookEvent, payload: unknown): Promise<void> {
    const { data: hooks } = await db.from('webhooks').select('url, secret, events').eq('owner_id', ownerId).eq('active', true);
    const body = JSON.stringify({ event, createdAt: new Date().toISOString(), data: payload });
    const timestamp = String(Math.floor(Date.now() / 1000));
    await Promise.allSettled(
        (hooks ?? [])
            .filter((h: { events: string[] }) => h.events.includes(event))
            .map(async (h: { url: string; secret: string }) => {
                const signature = await hmacHex(h.secret, `${timestamp}.${body}`);
                await fetch(h.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-TimeSync-Timestamp': timestamp, 'X-TimeSync-Signature': `sha256=${signature}` },
                    body,
                    signal: AbortSignal.timeout(5000),
                });
            }),
    );
}

export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
