import type { Chronotype } from './types.ts';

// Hour-by-hour (local time, 0–23) energy on a 0–10 scale, based on the Breus chronotype model.
const CURVES: Record<Chronotype, number[]> = {
    //     0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
    lion: [1, 1, 1, 1, 2, 4, 7, 9, 10, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1],
    bear: [1, 1, 1, 1, 1, 2, 3, 5, 7, 8, 9, 10, 9, 8, 7, 7, 6, 5, 5, 4, 3, 2, 2, 1],
    wolf: [3, 2, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 6, 6, 7, 7, 8, 9, 10, 10, 9, 8, 6, 4],
    dolphin: [2, 2, 2, 2, 2, 2, 3, 4, 5, 6, 8, 8, 6, 5, 6, 8, 8, 6, 5, 4, 3, 3, 2, 2],
};

export const DEFAULT_CHRONOTYPE: Chronotype = 'bear';

/** Energy (0–10) at a fractional local hour, linearly interpolated between hours. */
export function energyAt(chronotype: Chronotype | undefined, hour: number): number {
    const curve = CURVES[chronotype ?? DEFAULT_CHRONOTYPE];
    const h = ((hour % 24) + 24) % 24;
    const lo = Math.floor(h);
    const hi = (lo + 1) % 24;
    const t = h - lo;
    return curve[lo] * (1 - t) + curve[hi] * t;
}

export function energyCurve(chronotype: Chronotype | undefined): number[] {
    return [...CURVES[chronotype ?? DEFAULT_CHRONOTYPE]];
}

/** Local hours where energy is at least 8/10. */
export function peakHours(chronotype: Chronotype | undefined): number[] {
    return energyCurve(chronotype)
        .map((level, hour) => ({ level, hour }))
        .filter((e) => e.level >= 8)
        .map((e) => e.hour);
}

export function energyLabel(level: number): 'Peak' | 'High' | 'Medium' | 'Low' {
    if (level >= 8) return 'Peak';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
}

/** Peak hours as contiguous local windows, e.g. dolphin → [[10, 12], [15, 17]]. */
export function peakWindows(chronotype: Chronotype | undefined): [number, number][] {
    const out: [number, number][] = [];
    for (const h of peakHours(chronotype)) {
        const last = out[out.length - 1];
        if (last && last[1] === h) last[1] = h + 1;
        else out.push([h, h + 1]);
    }
    return out;
}

export function formatPeakWindows(chronotype: Chronotype | undefined): string {
    return peakWindows(chronotype).map(([a, b]) => `${a}:00–${b}:00`).join(', ');
}
