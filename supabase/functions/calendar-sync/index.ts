// Calendar sync (Pro): connect Google / Outlook via OAuth code, pull busy time, disconnect.
//   POST { action: 'connect', provider, code, redirectUri, codeVerifier? }
//   POST { action: 'sync' }
//   POST { action: 'disconnect', connectionId }
import { z } from 'zod';
import { connectCalendar, syncBusy } from '../_shared/calendar.ts';
import { HttpError, handler, json, rateLimit, readJson, requireUser, serviceClient } from '../_shared/http.ts';

const body = z.discriminatedUnion('action', [
    z.object({ action: z.literal('connect'), provider: z.enum(['google', 'outlook']), code: z.string().min(1).max(2000), redirectUri: z.url(), codeVerifier: z.string().max(200).optional() }),
    z.object({ action: z.literal('sync') }),
    z.object({ action: z.literal('disconnect'), connectionId: z.uuid() }),
]);

Deno.serve(
    handler(async (req) => {
        if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
        const user = await requireUser(req);
        const db = serviceClient();
        await rateLimit(db, `calendar:${user.id}`, 600, 30);
        const parsed = body.safeParse(await readJson(req));
        if (!parsed.success) throw new HttpError(400, 'Invalid request');

        const { data: profile } = await db.from('profiles').select('tier').eq('id', user.id).single();
        if (profile?.tier === 'free' && parsed.data.action !== 'disconnect') throw new HttpError(402, 'Calendar sync is a Pro feature');

        switch (parsed.data.action) {
            case 'connect': {
                const conn = await connectCalendar(db, user.id, parsed.data.provider, parsed.data.code, parsed.data.redirectUri, parsed.data.codeVerifier);
                const now = new Date();
                const synced = await syncBusy(db, user.id, now, new Date(now.getTime() + 60 * 86_400_000));
                return json({ connection: conn, busyBlocks: synced });
            }
            case 'sync': {
                const now = new Date();
                return json({ busyBlocks: await syncBusy(db, user.id, now, new Date(now.getTime() + 60 * 86_400_000)) });
            }
            case 'disconnect': {
                const { data: conn } = await db.from('calendar_connections').select('provider').eq('id', parsed.data.connectionId).eq('user_id', user.id).maybeSingle();
                if (!conn) throw new HttpError(404, 'Connection not found');
                await db.from('calendar_connections').delete().eq('id', parsed.data.connectionId);
                await db.from('busy_blocks').delete().eq('user_id', user.id).eq('source', conn.provider);
                return json({ ok: true });
            }
        }
    }),
);
