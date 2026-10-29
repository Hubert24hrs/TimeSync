// Authenticated, rate-limited AI scheduling assistant. The app never talks to an AI provider:
// it calls this function, which grounds the model in the user's real schedule data.
// With no ANTHROPIC_API_KEY configured, it answers with the deterministic engine assistant.
import Anthropic from '@anthropic-ai/sdk';
import { assistantFacts, assistantReply, chatRequestSchema, type AssistantContext, type Participant } from '../../../src/engine/index.ts';
import { HttpError, handler, json, rateLimit, readJson, requireUser, serviceClient } from '../_shared/http.ts';

const MODEL = 'claude-opus-5-5';
// The AI model is a Pro/Team feature; Free gets the deterministic engine assistant (no provider cost).
const DAILY_LIMIT: Record<string, number> = { free: 200, pro: 200, teams: 400 };

const SYSTEM = `You are TimeSync's scheduling assistant for globally distributed teams.
Answer in at most 120 words, warm and direct, using plain text with short bullet lists when listing times.
Ground every claim about times, conflicts, holidays, energy or DST in the FACTS JSON supplied with each message; never invent meetings, people or times.
Show times in the user's own time zone, and mention who would be outside working hours when relevant.
If the FACTS do not cover the question, say what you can help with instead (finding fair meeting times, energy peaks, conflicts, focus time, holidays, DST changes).`;

// deno-lint-ignore no-explicit-any
function toParticipant(p: any): Participant {
    return {
        id: p.id,
        name: p.display_name || p.username,
        timezone: p.timezone,
        chronotype: p.chronotype,
        countryCode: p.country_code ?? undefined,
        workingHours: { start: Number(p.working_start), end: Number(p.working_end) },
    };
}

Deno.serve(
    handler(async (req) => {
        if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
        const user = await requireUser(req);
        const db = serviceClient();
        await rateLimit(db, `chat-burst:${user.id}`, 600, 20);

        const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
        if (!profile) throw new HttpError(404, 'Profile not found');
        await rateLimit(db, `chat-day:${user.id}`, 86_400, DAILY_LIMIT[profile.tier] ?? 5);

        const parsed = chatRequestSchema.safeParse(await readJson(req));
        if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid message');
        const { message, history } = parsed.data;

        const { data: memberships } = await db.from('team_members').select('team_id').eq('user_id', user.id);
        const teamIds = (memberships ?? []).map((m: { team_id: string }) => m.team_id);
        const { data: mates } = teamIds.length
            ? await db.from('team_members').select('profiles(*)').in('team_id', teamIds).neq('user_id', user.id)
            : { data: [] };
        const now = Date.now();
        const { data: bookings } = await db
            .from('bookings')
            .select('start_at, end_at, event_types(title)')
            .eq('host_id', user.id)
            .eq('status', 'confirmed')
            .gte('end_at', new Date(now).toISOString())
            .lte('start_at', new Date(now + 14 * 86_400_000).toISOString());

        const ctx: AssistantContext = {
            now,
            user: toParticipant(profile),
            // deno-lint-ignore no-explicit-any
            team: [...new Map((mates ?? []).map((m: any) => [m.profiles.id, toParticipant(m.profiles)])).values()],
            // deno-lint-ignore no-explicit-any
            meetings: (bookings ?? []).map((b: any) => ({ title: b.event_types?.title ?? 'Meeting', start: Date.parse(b.start_at), end: Date.parse(b.end_at) })),
        };
        const local = assistantReply(message, ctx);
        const suggestions = local.suggestions.map((s) => ({ start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString(), fairness: s.fairnessScore, energy: s.energyScore, pros: s.pros, cons: s.cons }));

        if (!Deno.env.get('ANTHROPIC_API_KEY') || profile.tier === 'free') {
            return json({ text: local.text, suggestions, quickReplies: local.quickReplies, source: 'engine' });
        }

        const client = new Anthropic();
        try {
            const response = await client.beta.messages.create({
                model: MODEL,
                max_tokens: 16000,
                output_config: { effort: 'low' },
                // On a policy decline, the API retries on its server-defined fallback model.
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                system: SYSTEM,
                messages: [
                    ...history.map((h) => ({ role: h.role, content: h.content })),
                    { role: 'user', content: `FACTS:\n${JSON.stringify(assistantFacts(ctx))}\n\nQUESTION:\n${message}` },
                ],
            });
            if (response.stop_reason === 'refusal') {
                return json({ text: local.text, suggestions, quickReplies: local.quickReplies, source: 'engine' });
            }
            const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
            return json({ text: text || local.text, suggestions, quickReplies: local.quickReplies, source: 'ai' });
        } catch (err) {
            if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.APIConnectionError || err instanceof Anthropic.InternalServerError) {
                console.warn('AI provider unavailable, using engine reply', err.message);
                return json({ text: local.text, suggestions, quickReplies: local.quickReplies, source: 'engine' });
            }
            if (err instanceof Anthropic.APIError) {
                console.error('AI provider error', err.status, err.message);
                return json({ text: local.text, suggestions, quickReplies: local.quickReplies, source: 'engine' });
            }
            throw err;
        }
    }),
);
