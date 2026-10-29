import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError, env } from './http.ts';

// Two-way sync with Google Calendar and Microsoft 365 (Outlook): read busy time for conflict
// checks, write bookings (with auto-generated Meet / Teams links), update and delete them.

export type Provider = 'google' | 'outlook';

interface Connection {
    id: string;
    provider: Provider;
    user_id: string;
    write_bookings: boolean;
    check_conflicts: boolean;
}

const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const MS_TOKEN = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MS_SCOPE = 'offline_access openid email User.Read Calendars.ReadWrite';
const GCAL = 'https://www.googleapis.com/calendar/v3/calendars/primary';
const GRAPH = 'https://graph.microsoft.com/v1.0/me';

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}

async function tokenRequest(provider: Provider, params: Record<string, string>): Promise<TokenResponse> {
    const body = new URLSearchParams(
        provider === 'google'
            ? { client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), ...params }
            : { client_id: env('MICROSOFT_CLIENT_ID'), client_secret: env('MICROSOFT_CLIENT_SECRET'), scope: MS_SCOPE, ...params },
    );
    const res = await fetch(provider === 'google' ? GOOGLE_TOKEN : MS_TOKEN, { method: 'POST', body });
    if (!res.ok) throw new HttpError(400, `Could not authorize ${provider === 'google' ? 'Google' : 'Outlook'} calendar`);
    return (await res.json()) as TokenResponse;
}

/** Exchanges an OAuth code (from the app's auth session) and stores the connection + tokens. */
export async function connectCalendar(db: SupabaseClient, userId: string, provider: Provider, code: string, redirectUri: string, codeVerifier?: string) {
    const tokens = await tokenRequest(provider, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });
    const me = await fetch(provider === 'google' ? 'https://openidconnect.googleapis.com/v1/userinfo' : GRAPH, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    }).then((r) => r.json() as Promise<{ email?: string; mail?: string; userPrincipalName?: string }>);
    const email = me.email ?? me.mail ?? me.userPrincipalName ?? 'unknown';

    const { data: conn, error } = await db
        .from('calendar_connections')
        .upsert({ user_id: userId, provider, account_email: email }, { onConflict: 'user_id,provider,account_email' })
        .select('id')
        .single();
    if (error) throw error;
    await db.from('calendar_tokens').upsert({
        connection_id: conn.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });
    return { id: conn.id as string, email };
}

async function accessToken(db: SupabaseClient, connectionId: string, provider: Provider): Promise<string> {
    const { data } = await db.from('calendar_tokens').select('*').eq('connection_id', connectionId).single();
    if (!data) throw new Error('Calendar token missing');
    if (data.expires_at && Date.parse(data.expires_at) > Date.now() + 60_000) return data.access_token;
    if (!data.refresh_token) throw new Error('Calendar needs to be reconnected');
    const fresh = await tokenRequest(provider, { grant_type: 'refresh_token', refresh_token: data.refresh_token });
    await db
        .from('calendar_tokens')
        .update({
            access_token: fresh.access_token,
            refresh_token: fresh.refresh_token ?? data.refresh_token,
            expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
        })
        .eq('connection_id', connectionId);
    return fresh.access_token;
}

async function connections(db: SupabaseClient, userId: string): Promise<Connection[]> {
    const { data } = await db.from('calendar_connections').select('id, provider, user_id, write_bookings, check_conflicts').eq('user_id', userId);
    return (data ?? []) as Connection[];
}

/** Pulls busy intervals from every connected calendar into busy_blocks (replacing the window). */
export async function syncBusy(db: SupabaseClient, userId: string, from: Date, to: Date): Promise<number> {
    let total = 0;
    for (const c of await connections(db, userId)) {
        if (!c.check_conflicts) continue;
        const token = await accessToken(db, c.id, c.provider);
        let busy: { start: string; end: string; id: string }[] = [];
        if (c.provider === 'google') {
            const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: 'primary' }] }),
            });
            const body = (await res.json()) as { calendars?: { primary?: { busy?: { start: string; end: string }[] } } };
            busy = (body.calendars?.primary?.busy ?? []).map((b) => ({ ...b, id: `${b.start}|${b.end}` }));
        } else {
            const url = `${GRAPH}/calendarView?startDateTime=${from.toISOString()}&endDateTime=${to.toISOString()}&$select=id,start,end,showAs&$top=500`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' } });
            const body = (await res.json()) as { value?: { id: string; showAs: string; start: { dateTime: string }; end: { dateTime: string } }[] };
            busy = (body.value ?? [])
                .filter((e) => e.showAs !== 'free')
                .map((e) => ({ id: e.id, start: `${e.start.dateTime}Z`, end: `${e.end.dateTime}Z` }));
        }
        await db.from('busy_blocks').delete().eq('user_id', userId).eq('source', c.provider).gte('start_at', from.toISOString()).lt('start_at', to.toISOString());
        if (busy.length) {
            await db.from('busy_blocks').upsert(
                busy.map((b) => ({ user_id: userId, source: c.provider, external_id: b.id, start_at: b.start, end_at: b.end })),
                { onConflict: 'user_id,source,external_id' },
            );
        }
        await db.from('calendar_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', c.id);
        total += busy.length;
    }
    return total;
}

export interface CalendarEventInput {
    requestId: string;
    title: string;
    description: string;
    start: string;
    end: string;
    attendees: { email: string; name: string }[];
    /** Ask the provider for a video link (Google Meet / Teams). */
    video: boolean;
    location?: string;
}

/** Writes the booking to the host's calendars; returns external ids and the first video link. */
export async function createCalendarEvents(db: SupabaseClient, userId: string, e: CalendarEventInput) {
    const ids: Record<string, string> = {};
    let meetingUrl: string | undefined;
    for (const c of await connections(db, userId)) {
        if (!c.write_bookings) continue;
        try {
            const token = await accessToken(db, c.id, c.provider);
            if (c.provider === 'google') {
                const res = await fetch(`${GCAL}/events?conferenceDataVersion=1&sendUpdates=all`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        summary: e.title,
                        description: e.description,
                        location: e.location,
                        start: { dateTime: e.start },
                        end: { dateTime: e.end },
                        attendees: e.attendees.map((a) => ({ email: a.email, displayName: a.name })),
                        conferenceData: e.video ? { createRequest: { requestId: e.requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } } : undefined,
                    }),
                });
                const body = (await res.json()) as { id?: string; hangoutLink?: string };
                if (body.id) ids[`google:${c.id}`] = body.id;
                meetingUrl ??= body.hangoutLink;
            } else {
                const res = await fetch(`${GRAPH}/events`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: e.title,
                        body: { contentType: 'text', content: e.description },
                        location: e.location ? { displayName: e.location } : undefined,
                        start: { dateTime: e.start.replace('Z', ''), timeZone: 'UTC' },
                        end: { dateTime: e.end.replace('Z', ''), timeZone: 'UTC' },
                        attendees: e.attendees.map((a) => ({ emailAddress: { address: a.email, name: a.name }, type: 'required' })),
                        isOnlineMeeting: e.video,
                        onlineMeetingProvider: e.video ? 'teamsForBusiness' : undefined,
                        transactionId: e.requestId,
                    }),
                });
                const body = (await res.json()) as { id?: string; onlineMeeting?: { joinUrl?: string } };
                if (body.id) ids[`outlook:${c.id}`] = body.id;
                meetingUrl ??= body.onlineMeeting?.joinUrl;
            }
        } catch (err) {
            console.error('calendar write failed', c.provider, err);
        }
    }
    return { ids, meetingUrl };
}

/** Moves or deletes previously written events (reschedule / cancel). */
export async function updateCalendarEvents(db: SupabaseClient, externalIds: Record<string, string>, change: { start: string; end: string } | 'delete') {
    for (const [key, eventId] of Object.entries(externalIds)) {
        const [provider, connectionId] = key.split(':') as [Provider, string];
        try {
            const token = await accessToken(db, connectionId, provider);
            const url = provider === 'google' ? `${GCAL}/events/${encodeURIComponent(eventId)}?sendUpdates=all` : `${GRAPH}/events/${encodeURIComponent(eventId)}`;
            if (change === 'delete') {
                await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            } else {
                const body =
                    provider === 'google'
                        ? { start: { dateTime: change.start }, end: { dateTime: change.end } }
                        : { start: { dateTime: change.start.replace('Z', ''), timeZone: 'UTC' }, end: { dateTime: change.end.replace('Z', ''), timeZone: 'UTC' } };
                await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            }
        } catch (err) {
            console.error('calendar update failed', key, err);
        }
    }
}
