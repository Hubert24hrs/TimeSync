import { DateTime } from 'luxon';
import { energyAt } from './chronotype.ts';
import { holidayOn, isWorkday } from './culture.ts';
import { MINUTE, cityFromZone, localDate, localHour, localWeekday, overlaps } from './time.ts';
import type { Interval, Participant } from './types.ts';

export type HourBand = 'ideal' | 'stretch' | 'unsocial' | 'night' | 'off_day' | 'holiday';

const BAND_RANK: Record<HourBand, number> = { ideal: 0, stretch: 1, unsocial: 2, off_day: 3, holiday: 4, night: 5 };

export interface ParticipantSlot {
    id: string;
    name: string;
    timezone: string;
    localStart: number;
    band: HourBand;
    /** 0 (ideal) … 1 (worst) inconvenience. */
    penalty: number;
    /** 0–10 energy at the meeting midpoint. */
    energy: number;
    holiday?: string;
}

export interface SlotScore extends Interval {
    fairnessScore: number;
    energyScore: number;
    score: number;
    participants: ParticipantSlot[];
    pros: string[];
    cons: string[];
}

export interface OptimizerOptions {
    durationMinutes: number;
    from: number;
    to: number;
    stepMinutes?: number;
    /** Accumulated past inconvenience per participant (sum of penalties), for rotating the pain fairly. */
    history?: Record<string, number>;
    weights?: { fairness: number; energy: number };
    /** Never suggest slots where a required participant would be in the night band. */
    excludeNight?: boolean;
    limit?: number;
    /** Minimum distance between returned suggestions. */
    minGapMinutes?: number;
}

const DEFAULT_HOURS = { start: 9, end: 17 };
const SAMPLE_MINUTES = 15;
const OFF_DAY_PENALTY = 0.6;
const HOLIDAY_PENALTY = 0.8;

/** Inconvenience (0–1) of being in a meeting at a fractional local hour. */
export function hourPenalty(hour: number, working = DEFAULT_HOURS): { penalty: number; band: HourBand } {
    if (hour >= working.start && hour < working.end) return { penalty: 0, band: 'ideal' };
    if (hour >= 23 || hour < 6) return { penalty: 1, band: 'night' };
    if (hour >= 21 || hour < 7) return { penalty: 0.5, band: 'unsocial' };
    const distance = hour < working.start ? working.start - hour : hour - working.end;
    return { penalty: Math.min(0.4, 0.1 + distance * 0.15), band: 'stretch' };
}

function worse(a: HourBand, b: HourBand): HourBand {
    return BAND_RANK[a] >= BAND_RANK[b] ? a : b;
}

export function participantSlot(p: Participant, slot: Interval): ParticipantSlot {
    const working = p.workingHours ?? DEFAULT_HOURS;
    let total = 0;
    let samples = 0;
    let band: HourBand = 'ideal';
    for (let t = slot.start; t < slot.end; t += SAMPLE_MINUTES * MINUTE) {
        const mid = Math.min(t + (SAMPLE_MINUTES * MINUTE) / 2, slot.end - 1);
        const hp = hourPenalty(localHour(mid, p.timezone), working);
        total += hp.penalty;
        samples += 1;
        band = worse(band, hp.band);
    }
    let penalty = samples ? total / samples : 0;

    const date = localDate(slot.start, p.timezone);
    const holiday = holidayOn(date, p.countryCode);
    if (holiday) {
        penalty = Math.max(penalty, HOLIDAY_PENALTY);
        band = worse(band, 'holiday');
    } else if (!isWorkday(localWeekday(slot.start, p.timezone), p.countryCode)) {
        penalty = Math.max(penalty, OFF_DAY_PENALTY);
        band = worse(band, 'off_day');
    }

    const midpoint = (slot.start + slot.end) / 2;
    return {
        id: p.id,
        name: p.name,
        timezone: p.timezone,
        localStart: slot.start,
        band,
        penalty: Math.min(1, penalty),
        energy: energyAt(p.chronotype, localHour(midpoint, p.timezone)),
        holiday: holiday?.name,
    };
}

function stdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
}

function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

function describe(ps: ParticipantSlot): string {
    const city = cityFromZone(ps.timezone);
    const at = DateTime.fromMillis(ps.localStart, { zone: ps.timezone }).toFormat('h:mm a');
    switch (ps.band) {
        case 'night':
            return `Night-time for ${ps.name.split(' ')[0]} in ${city} (${at})`;
        case 'unsocial':
            return `Unsocial hours for ${ps.name.split(' ')[0]} in ${city} (${at})`;
        case 'holiday':
            return `${ps.holiday ?? 'Holiday'} for ${ps.name.split(' ')[0]} (${city})`;
        case 'off_day':
            return `Weekend for ${ps.name.split(' ')[0]} in ${city}`;
        default:
            return `Outside core hours for ${ps.name.split(' ')[0]} (${at})`;
    }
}

/**
 * Scores one candidate slot.
 * fairness = 100 × (1 − (0.5·mean + 0.3·worst + 0.2·added-inequality)), where penalties are 0–1 and
 * added-inequality measures how much this slot widens the spread of accumulated burden (history).
 */
export function scoreSlot(participants: Participant[], slot: Interval, options: Pick<OptimizerOptions, 'history' | 'weights'> = {}): SlotScore {
    const weights = options.weights ?? { fairness: 0.65, energy: 0.35 };
    const infos = participants.map((p) => participantSlot(p, slot));
    const required = infos.filter((_, i) => !participants[i].optional);
    const pool = required.length ? required : infos;

    const weighted = infos.map((info, i) => info.penalty * (participants[i].optional ? 0.5 : 1));
    const mean = weighted.reduce((a, b) => a + b, 0) / Math.max(1, infos.length);
    const worst = Math.max(0, ...pool.map((i) => i.penalty));
    const history = options.history ?? {};
    const before = participants.map((p) => history[p.id] ?? 0);
    const after = participants.map((p, i) => before[i] + infos[i].penalty);
    const addedInequality = clamp01((stdDev(after) - stdDev(before)) * 2);

    const fairnessScore = Math.round(100 * (1 - clamp01(0.5 * mean + 0.3 * worst + 0.2 * addedInequality)));
    const energyScore = Math.round((infos.reduce((a, i) => a + i.energy, 0) / Math.max(1, infos.length)) * 10);
    const score = Math.round(weights.fairness * fairnessScore + weights.energy * energyScore);

    const ideal = infos.filter((i) => i.band === 'ideal').length;
    const pros: string[] = [];
    const cons: string[] = [];
    if (ideal === infos.length) pros.push('Inside working hours for everyone');
    else pros.push(`Working hours for ${ideal} of ${infos.length}`);
    if (energyScore >= 70) pros.push('High team energy');
    if (worst === 0 && infos.length > 1) pros.push('Nobody stays late or starts early');
    if (addedInequality === 0 && Object.keys(history).length > 0) pros.push('Rotates inconvenience fairly');
    infos.filter((i) => i.band !== 'ideal').sort((a, b) => b.penalty - a.penalty).forEach((i) => cons.push(describe(i)));
    if (energyScore < 45) cons.push('Low energy for most attendees');

    return { ...slot, fairnessScore, energyScore, score, participants: infos, pros, cons };
}

function isBlocked(participants: Participant[], slot: Interval): boolean {
    return participants.some((p) => !p.optional && (p.busy ?? []).some((b) => overlaps(b, slot)));
}

/** Ranks candidate meeting times across zones. Returns the best `limit` slots, best first. */
export function findOptimalSlots(participants: Participant[], options: OptimizerOptions): SlotScore[] {
    const step = (options.stepMinutes ?? 30) * MINUTE;
    const duration = options.durationMinutes * MINUTE;
    if (duration <= 0) throw new Error('durationMinutes must be positive');
    const first = Math.ceil(options.from / step) * step;
    const scored: SlotScore[] = [];
    for (let start = first; start + duration <= options.to; start += step) {
        const slot = { start, end: start + duration };
        if (isBlocked(participants, slot)) continue;
        const s = scoreSlot(participants, slot, options);
        if (options.excludeNight && s.participants.some((p, i) => !participants[i].optional && p.band === 'night')) continue;
        scored.push(s);
    }
    scored.sort((a, b) => b.score - a.score || b.fairnessScore - a.fairnessScore || a.start - b.start);

    const gap = (options.minGapMinutes ?? 0) * MINUTE;
    const picked: SlotScore[] = [];
    for (const s of scored) {
        if (picked.length >= (options.limit ?? 10)) break;
        if (gap > 0 && picked.some((p) => Math.abs(p.start - s.start) < gap)) continue;
        picked.push(s);
    }
    return picked;
}

/** Ranks given slots by mean team energy (chronotype-aware), highest first. */
export function rankByEnergy(participants: Participant[], slots: Interval[]): SlotScore[] {
    return slots.map((s) => scoreSlot(participants, s)).sort((a, b) => b.energyScore - a.energyScore || a.start - b.start);
}

/**
 * For each hour of `date` in `viewerZone`, how many participants are inside working hours on a workday.
 * Drives the overlap heatmap on Team and Polls.
 */
export function overlapHeatmap(participants: Participant[], date: string, viewerZone: string): { hour: number; start: number; available: number; total: number }[] {
    const dayStart = DateTime.fromISO(date, { zone: viewerZone }).startOf('day');
    return Array.from({ length: 24 }, (_, hour) => {
        const start = dayStart.plus({ hours: hour }).toMillis();
        const slot = { start, end: start + 60 * MINUTE };
        const available = participants.filter((p) => participantSlot(p, slot).band === 'ideal').length;
        return { hour, start, available, total: participants.length };
    });
}
