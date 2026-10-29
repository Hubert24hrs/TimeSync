import { DateTime } from 'luxon';
import { energyAt, formatPeakWindows, peakHours } from './chronotype.ts';
import { holidaysBetween } from './culture.ts';
import { findOptimalSlots, type SlotScore } from './optimizer.ts';
import { cityFromZone, nextDstTransition, overlaps } from './time.ts';
import type { Participant } from './types.ts';

// Deterministic scheduling assistant. Used offline / in demo mode, as the server fallback when no
// AI provider is configured, and to build the grounded context the AI provider answers from.

export interface AssistantContext {
    now: number;
    user: Participant;
    team: Participant[];
    meetings: { title: string; start: number; end: number }[];
}

export interface AssistantReply {
    text: string;
    suggestions: SlotScore[];
    quickReplies: string[];
}

const QUICK = ['Best time for the team', 'When is my energy peak?', 'Any conflicts?', 'Find focus time', 'Upcoming holidays'];

function fmt(ms: number, zone: string): string {
    return DateTime.fromMillis(ms, { zone }).toFormat('ccc d LLL, h:mm a');
}

export function teamSuggestions(ctx: AssistantContext, durationMinutes = 60, days = 5): SlotScore[] {
    const people = [ctx.user, ...ctx.team.filter((t) => t.id !== ctx.user.id)];
    return findOptimalSlots(people, { durationMinutes, from: ctx.now + 3_600_000, to: ctx.now + days * 86_400_000, limit: 3, minGapMinutes: 180 });
}

function conflicts(ctx: AssistantContext): [AssistantContext['meetings'][number], AssistantContext['meetings'][number]][] {
    const upcoming = ctx.meetings.filter((m) => m.end > ctx.now).sort((a, b) => a.start - b.start);
    const out: [typeof upcoming[number], typeof upcoming[number]][] = [];
    for (let i = 0; i < upcoming.length; i++) {
        for (let j = i + 1; j < upcoming.length && upcoming[j].start < upcoming[i].end; j++) {
            if (overlaps(upcoming[i], upcoming[j])) out.push([upcoming[i], upcoming[j]]);
        }
    }
    return out;
}

/** Facts the AI provider may use; keeps answers grounded in real data. */
export function assistantFacts(ctx: AssistantContext) {
    const zone = ctx.user.timezone;
    const from = DateTime.fromMillis(ctx.now, { zone });
    const countries = [...new Set([ctx.user, ...ctx.team].map((p) => p.countryCode).filter((c): c is string => !!c))];
    return {
        now: from.toISO(),
        user: { name: ctx.user.name, timezone: zone, chronotype: ctx.user.chronotype ?? 'bear', peakHoursLocal: peakHours(ctx.user.chronotype) },
        team: ctx.team.map((t) => ({ name: t.name, timezone: t.timezone, country: t.countryCode, chronotype: t.chronotype })),
        suggestedSlots: teamSuggestions(ctx).map((s) => ({ start: new Date(s.start).toISOString(), userLocal: fmt(s.start, zone), fairness: s.fairnessScore, energy: s.energyScore, pros: s.pros, cons: s.cons })),
        conflicts: conflicts(ctx).map(([a, b]) => ({ a: a.title, b: b.title, at: fmt(a.start, zone) })),
        upcomingHolidays: holidaysBetween(from.toISODate()!, from.plus({ days: 30 }).toISODate()!, countries).slice(0, 8).map((h) => ({ name: h.name, date: h.date, countries: h.countries })),
        dstChanges: [...new Set([zone, ...ctx.team.map((t) => t.timezone)])]
            .map((z) => ({ zone: z, change: nextDstTransition(z, ctx.now, 60) }))
            .filter((d) => d.change)
            .map((d) => ({ zone: d.zone, at: new Date(d.change!.at).toISOString(), shiftMinutes: d.change!.offsetChangeMinutes })),
    };
}

export function assistantReply(message: string, ctx: AssistantContext): AssistantReply {
    const q = message.toLowerCase();
    const zone = ctx.user.timezone;

    if (/(best|optimal|good) time|schedule|meeting|book|slot|when can/.test(q)) {
        const suggestions = teamSuggestions(ctx, /30\s*min/.test(q) ? 30 : 60);
        if (suggestions.length === 0) return { text: 'I could not find a slot in the next few days that avoids night-time for everyone. Try a shorter meeting or an async update.', suggestions, quickReplies: QUICK };
        const best = suggestions[0];
        const lines = suggestions.map((s, i) => `${i + 1}. ${fmt(s.start, zone)} — fairness ${s.fairnessScore}, energy ${s.energyScore}${s.cons[0] ? ` (${s.cons[0]})` : ''}`);
        return {
            text: `Here are the fairest times across ${ctx.team.length + 1} people (your time):\n\n${lines.join('\n')}\n\nTop pick: ${fmt(best.start, zone)}. ${best.pros[0]}.`,
            suggestions,
            quickReplies: ['Book the top pick', 'Make it 30 minutes', 'Any conflicts?'],
        };
    }
    if (/energy|peak|tired|productive|chronotype/.test(q)) {
        const hour = DateTime.fromMillis(ctx.now, { zone }).hour;
        const now = Math.round(energyAt(ctx.user.chronotype, hour));
        const range = formatPeakWindows(ctx.user.chronotype) || 'mid-morning';
        return { text: `As a ${ctx.user.chronotype ?? 'bear'}, your peak focus is ${range} local time. Right now you are around ${now}/10. Put deep work and hard conversations in your peak; keep admin for the dips.`, suggestions: [], quickReplies: QUICK };
    }
    if (/conflict|overlap|double/.test(q)) {
        const c = conflicts(ctx);
        if (c.length === 0) return { text: 'No overlapping meetings in your upcoming schedule. 🎉', suggestions: [], quickReplies: QUICK };
        return { text: `I found ${c.length} conflict${c.length > 1 ? 's' : ''}:\n\n${c.map(([a, b]) => `• "${a.title}" overlaps "${b.title}" on ${fmt(a.start, zone)}`).join('\n')}\n\nOpen the optimizer to move one of them.`, suggestions: [], quickReplies: ['Best time for the team'] };
    }
    if (/focus|deep work|block/.test(q)) {
        const peaks = new Set(peakHours(ctx.user.chronotype));
        const blocks: string[] = [];
        let day = DateTime.fromMillis(ctx.now, { zone }).startOf('day');
        for (let d = 0; d < 7 && blocks.length < 3; d++, day = day.plus({ days: 1 })) {
            if (day.weekday > 5) continue;
            const hours = [...peaks].sort((a, b) => a - b);
            if (hours.length < 2) continue;
            const start = day.set({ hour: hours[0] }).toMillis();
            const end = day.set({ hour: hours[hours.length - 1] + 1 }).toMillis();
            if (start < ctx.now) continue;
            if (!ctx.meetings.some((m) => overlaps(m, { start, end }))) blocks.push(`• ${fmt(start, zone)} – ${DateTime.fromMillis(end, { zone }).toFormat('h:mm a')}`);
        }
        return { text: blocks.length ? `Meeting-free blocks inside your energy peak:\n\n${blocks.join('\n')}` : 'Your peak hours are booked this week. Consider declining one recurring meeting to protect focus time.', suggestions: [], quickReplies: QUICK };
    }
    if (/holiday|festival|observance|ramadan|culture/.test(q)) {
        const f = assistantFacts(ctx).upcomingHolidays;
        return { text: f.length ? `Coming up for your team (30 days):\n\n${f.map((h) => `• ${h.date}: ${h.name}`).join('\n')}` : 'No major holidays for your team in the next 30 days.', suggestions: [], quickReplies: QUICK };
    }
    if (/dst|daylight|clock/.test(q)) {
        const d = assistantFacts(ctx).dstChanges;
        return { text: d.length ? `Clock changes in the next 60 days:\n\n${d.map((x) => `• ${cityFromZone(x.zone)}: ${x.shiftMinutes > 0 ? '+' : ''}${x.shiftMinutes / 60}h on ${x.at.slice(0, 10)}`).join('\n')}\n\nRecurring meetings will shift for some people — I re-check fairness automatically.` : 'No DST changes for your team in the next 60 days.', suggestions: [], quickReplies: QUICK };
    }
    return {
        text: "I can find fair meeting times across time zones, check your energy peaks, spot conflicts, protect focus time, and flag holidays or DST changes. What do you need?",
        suggestions: [],
        quickReplies: QUICK,
    };
}
