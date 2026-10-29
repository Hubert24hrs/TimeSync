// Slack bot (Team plan): `/timesync` slash command.
//   /timesync link <code>  – connect your Slack user (code comes from the app: Profile → Integrations → Slack)
//   /timesync today        – your meetings today
//   /timesync find         – fairest times for your team this week
//   /timesync links        – your booking links
// The app requests a link code with POST { action: 'link-code' } + Authorization (JSON).
import { DateTime } from 'luxon';
import { teamSuggestions, type Participant } from '../../../src/engine/index.ts';
import { signLink, verifyLink } from '../../../src/engine/signedLinks.ts';
import { HttpError, env, handler, hmacHex, json, requireUser, serviceClient } from '../_shared/http.ts';

// deno-lint-ignore no-explicit-any
const toParticipant = (p: any): Participant => ({
    id: p.id,
    name: p.display_name || p.username,
    timezone: p.timezone,
    chronotype: p.chronotype,
    countryCode: p.country_code ?? undefined,
    workingHours: { start: Number(p.working_start), end: Number(p.working_end) },
});

async function verifySlack(req: Request, raw: string): Promise<void> {
    const ts = req.headers.get('x-slack-request-timestamp') ?? '';
    const sig = req.headers.get('x-slack-signature') ?? '';
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) throw new HttpError(401, 'Stale request');
    const expected = `v0=${await hmacHex(env('SLACK_SIGNING_SECRET'), `v0:${ts}:${raw}`)}`;
    if (expected.length !== sig.length || expected !== sig) throw new HttpError(401, 'Bad signature');
}

const reply = (text: string) => json({ response_type: 'ephemeral', text });

Deno.serve(
    handler(async (req) => {
        const db = serviceClient();
        if (req.headers.get('content-type')?.includes('application/json')) {
            const user = await requireUser(req);
            const code = await signLink({ sub: user.id, action: 'slack_link', exp: Math.floor(Date.now() / 1000) + 900 }, env('LINK_SIGNING_SECRET'));
            return json({ code, expiresInMinutes: 15 });
        }

        const raw = await req.text();
        await verifySlack(req, raw);
        const form = new URLSearchParams(raw);
        const teamId = form.get('team_id') ?? '';
        const slackUser = form.get('user_id') ?? '';
        const [command, ...args] = (form.get('text') ?? '').trim().split(/\s+/);

        if (command === 'link') {
            const claims = await verifyLink(args[0] ?? '', env('LINK_SIGNING_SECRET'));
            if (!claims || claims.action !== 'slack_link') return reply('That link code is invalid or expired. Get a new one in TimeSync → Profile → Integrations.');
            await db.from('slack_links').upsert({ slack_team_id: teamId, slack_user_id: slackUser, user_id: claims.sub });
            return reply('✅ Slack is connected to TimeSync.');
        }

        const { data: link } = await db.from('slack_links').select('user_id').eq('slack_team_id', teamId).eq('slack_user_id', slackUser).maybeSingle();
        if (!link) return reply('Connect first: in TimeSync open Profile → Integrations → Slack, then run `/timesync link <code>`.');
        const { data: profile } = await db.from('profiles').select('*').eq('id', link.user_id).single();
        if (profile.tier !== 'teams') return reply('The Slack bot is part of the TimeSync Team plan.');
        const zone = profile.timezone;

        if (command === 'today' || !command) {
            const day = DateTime.now().setZone(zone);
            const { data: bookings } = await db
                .from('bookings')
                .select('start_at, invitee_name, event_types(title)')
                .eq('host_id', profile.id)
                .eq('status', 'confirmed')
                .gte('start_at', day.startOf('day').toUTC().toISO())
                .lt('start_at', day.endOf('day').toUTC().toISO())
                .order('start_at');
            if (!bookings?.length) return reply('No meetings today. 🎉');
            // deno-lint-ignore no-explicit-any
            return reply(bookings.map((b: any) => `• ${DateTime.fromISO(b.start_at, { zone }).toFormat('h:mm a')} — ${b.event_types?.title ?? 'Meeting'} with ${b.invitee_name}`).join('\n'));
        }
        if (command === 'links') {
            const { data: types } = await db.from('event_types').select('slug, title').eq('owner_id', profile.id).eq('active', true);
            return reply((types ?? []).map((t: { slug: string; title: string }) => `• ${t.title}: ${env('PUBLIC_ORIGIN')}/${profile.username}/${t.slug}`).join('\n') || 'No active event types.');
        }
        if (command === 'find') {
            const { data: memberships } = await db.from('team_members').select('team_id').eq('user_id', profile.id);
            const { data: mates } = await db.from('team_members').select('profiles(*)').in('team_id', (memberships ?? []).map((m: { team_id: string }) => m.team_id));
            // deno-lint-ignore no-explicit-any
            const team = (mates ?? []).map((m: any) => toParticipant(m.profiles)).filter((p: Participant) => p.id !== profile.id);
            const slots = teamSuggestions({ now: Date.now(), user: toParticipant(profile), team, meetings: [] });
            if (!slots.length) return reply('No fair slot found this week.');
            return reply(slots.map((s) => `• ${DateTime.fromMillis(s.start, { zone }).toFormat('ccc d LLL, h:mm a')} — fairness ${s.fairnessScore}, energy ${s.energyScore}`).join('\n'));
        }
        return reply('Commands: `today`, `find`, `links`, `link <code>`');
    }),
);
