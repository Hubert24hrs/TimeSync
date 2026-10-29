import { DateTime, IANAZone } from 'luxon';
import type { Interval, TimeRange, Weekday } from './types.ts';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export function isValidTimeZone(tz: string): boolean {
    return typeof tz === 'string' && tz.length > 0 && IANAZone.isValidZone(tz);
}

/** Best-effort device zone; falls back to UTC when the runtime cannot tell. */
export function detectTimeZone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return tz && isValidTimeZone(tz) ? tz : 'UTC';
    } catch {
        return 'UTC';
    }
}

/** Parses 'HH:mm' (00:00–24:00) into minutes after midnight. */
export function parseClock(value: string): number {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!match) throw new Error(`Invalid clock time "${value}"`);
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 24 || m > 59 || (h === 24 && m !== 0)) throw new Error(`Invalid clock time "${value}"`);
    return h * 60 + m;
}

export function formatClock(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts a wall-clock time on a calendar date in `zone` to epoch ms.
 * Times inside a spring-forward gap resolve to the first valid instant after the gap;
 * ambiguous fall-back times resolve to the earlier (pre-transition) instant.
 */
export function wallClockToUtc(date: string, minutes: number, zone: string): number {
    const day = DateTime.fromISO(date, { zone });
    if (!day.isValid) throw new Error(`Invalid date "${date}" in zone "${zone}"`);
    if (minutes >= 24 * 60) {
        return day.plus({ days: 1 }).startOf('day').toMillis();
    }
    const target = day.set({ hour: Math.floor(minutes / 60), minute: minutes % 60, second: 0, millisecond: 0 });
    // Luxon pushes gap times forward by the gap length; clamp to the transition instead.
    if (target.hour * 60 + target.minute !== minutes) {
        let probe = day.startOf('day');
        while (probe.hour * 60 + probe.minute < minutes) probe = probe.plus({ minutes: 15 });
        return probe.toMillis();
    }
    return target.toMillis();
}

/** UTC intervals for a list of wall-clock ranges on one date in `zone`. */
export function rangesToIntervals(date: string, ranges: TimeRange[], zone: string): Interval[] {
    return ranges
        .map((r) => ({ start: wallClockToUtc(date, parseClock(r.start), zone), end: wallClockToUtc(date, parseClock(r.end), zone) }))
        .filter((i) => i.end > i.start);
}

/** Fractional local hour (0–24) of an instant in `zone`. */
export function localHour(ms: number, zone: string): number {
    const dt = DateTime.fromMillis(ms, { zone });
    return dt.hour + dt.minute / 60;
}

export function localWeekday(ms: number, zone: string): Weekday {
    return DateTime.fromMillis(ms, { zone }).weekday as Weekday;
}

export function localDate(ms: number, zone: string): string {
    return DateTime.fromMillis(ms, { zone }).toISODate() ?? '';
}

/** e.g. 'UTC+5:30', 'UTC−3', 'UTC'. DST-aware for the given instant. */
export function utcOffsetLabel(zone: string, at: number = Date.now()): string {
    const offset = DateTime.fromMillis(at, { zone }).offset;
    if (offset === 0) return 'UTC';
    const sign = offset > 0 ? '+' : '−';
    const abs = Math.abs(offset);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

export function isDst(zone: string, at: number = Date.now()): boolean {
    return DateTime.fromMillis(at, { zone }).isInDST;
}

/** Next DST transition within `horizonDays`, if the zone observes DST. */
export function nextDstTransition(zone: string, from: number = Date.now(), horizonDays = 400): { at: number; offsetChangeMinutes: number } | null {
    let cursor = DateTime.fromMillis(from, { zone });
    const startOffset = cursor.offset;
    const limit = cursor.plus({ days: horizonDays });
    // Coarse daily scan, then refine hourly.
    while (cursor < limit) {
        const next = cursor.plus({ days: 1 });
        if (next.offset !== cursor.offset) {
            let fine = cursor;
            while (fine.offset === cursor.offset) fine = fine.plus({ hours: 1 });
            return { at: fine.startOf('hour').toMillis(), offsetChangeMinutes: fine.offset - startOffset };
        }
        cursor = next;
    }
    return null;
}

export function formatInZone(ms: number, zone: string, format = 'HH:mm'): string {
    return DateTime.fromMillis(ms, { zone }).toFormat(format);
}

export function cityFromZone(zone: string): string {
    const parts = zone.split('/');
    return (parts[parts.length - 1] || zone).replace(/_/g, ' ');
}

export function overlaps(a: Interval, b: Interval): boolean {
    return a.start < b.end && b.start < a.end;
}

/** Sorts and merges overlapping/adjacent intervals. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const out: Interval[] = [];
    for (const i of sorted) {
        const last = out[out.length - 1];
        if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
        else out.push({ ...i });
    }
    return out;
}

/** Calendar dates (yyyy-MM-dd) in `zone` touched by [from, to). */
export function datesBetween(from: number, to: number, zone: string): string[] {
    const out: string[] = [];
    let day = DateTime.fromMillis(from, { zone }).startOf('day');
    const end = DateTime.fromMillis(to, { zone });
    while (day < end) {
        out.push(day.toISODate() ?? '');
        day = day.plus({ days: 1 });
    }
    return out;
}
