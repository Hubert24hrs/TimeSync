import type { Interval } from './types.ts';

export type VoteAnswer = 'yes' | 'maybe' | 'no';

export interface PollOption extends Interval {
    id: string;
}

export interface PollVote {
    voterId: string;
    optionId: string;
    answer: VoteAnswer;
}

export interface OptionTally {
    optionId: string;
    yes: number;
    maybe: number;
    no: number;
    /** yes = 1, maybe = 0.5 */
    score: number;
}

export function tallyPoll(options: PollOption[], votes: PollVote[]): OptionTally[] {
    // A voter's latest vote per option wins.
    const latest = new Map<string, PollVote>();
    for (const v of votes) latest.set(`${v.voterId}:${v.optionId}`, v);
    return options.map((o) => {
        const forOption = [...latest.values()].filter((v) => v.optionId === o.id);
        const yes = forOption.filter((v) => v.answer === 'yes').length;
        const maybe = forOption.filter((v) => v.answer === 'maybe').length;
        const no = forOption.filter((v) => v.answer === 'no').length;
        return { optionId: o.id, yes, maybe, no, score: yes + maybe * 0.5 };
    });
}

/** Winning option: highest score, then fewest "no", then earliest. Null when nobody voted yes/maybe. */
export function pollWinner(options: PollOption[], votes: PollVote[]): PollOption | null {
    const tallies = tallyPoll(options, votes);
    const ranked = options
        .map((o, i) => ({ o, t: tallies[i] }))
        .filter((x) => x.t.score > 0)
        .sort((a, b) => b.t.score - a.t.score || a.t.no - b.t.no || a.o.start - b.o.start);
    return ranked[0]?.o ?? null;
}

/** 0–1 intensity per option for the overlap heatmap. */
export function pollHeat(options: PollOption[], votes: PollVote[], voterCount: number): Record<string, number> {
    const out: Record<string, number> = {};
    for (const t of tallyPoll(options, votes)) out[t.optionId] = voterCount > 0 ? t.score / voterCount : 0;
    return out;
}
