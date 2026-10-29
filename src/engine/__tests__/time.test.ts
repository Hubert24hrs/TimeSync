import { DateTime } from 'luxon';
import { datesBetween, isValidTimeZone, localHour, mergeIntervals, nextDstTransition, parseClock, utcOffsetLabel, wallClockToUtc } from '../time';

const iso = (ms: number) => new Date(ms).toISOString();

describe('wallClockToUtc (DST edge cases)', () => {
    it('maps the same wall-clock time to different UTC instants across a DST change', () => {
        expect(iso(wallClockToUtc('2026-03-06', 9 * 60, 'America/New_York'))).toBe('2026-03-06T14:00:00.000Z'); // EST
        expect(iso(wallClockToUtc('2026-03-09', 9 * 60, 'America/New_York'))).toBe('2026-03-09T13:00:00.000Z'); // EDT
    });

    it('clamps a time inside the spring-forward gap to the first valid instant', () => {
        // 02:30 does not exist on 2026-03-08 in New York; clocks jump 02:00 → 03:00 EDT (07:00Z).
        expect(iso(wallClockToUtc('2026-03-08', 2 * 60 + 30, 'America/New_York'))).toBe('2026-03-08T07:00:00.000Z');
    });

    it('resolves an ambiguous fall-back time to the earlier instant', () => {
        // 01:30 happens twice on 2026-11-01 in New York; pick the EDT one.
        expect(iso(wallClockToUtc('2026-11-01', 90, 'America/New_York'))).toBe('2026-11-01T05:30:00.000Z');
    });

    it('treats 24:00 as the start of the next day', () => {
        expect(iso(wallClockToUtc('2026-03-07', 24 * 60, 'America/New_York'))).toBe('2026-03-08T05:00:00.000Z');
    });

    it('handles southern-hemisphere DST (Sydney, April fall-back)', () => {
        expect(iso(wallClockToUtc('2026-04-03', 9 * 60, 'Australia/Sydney'))).toBe('2026-04-02T22:00:00.000Z'); // AEDT +11
        expect(iso(wallClockToUtc('2026-04-06', 9 * 60, 'Australia/Sydney'))).toBe('2026-04-05T23:00:00.000Z'); // AEST +10
    });

    it('handles half-hour and no-DST zones', () => {
        expect(iso(wallClockToUtc('2026-07-01', 9 * 60, 'Asia/Kolkata'))).toBe('2026-07-01T03:30:00.000Z');
        expect(iso(wallClockToUtc('2026-07-01', 9 * 60, 'Asia/Kathmandu'))).toBe('2026-07-01T03:15:00.000Z');
    });
});

describe('time helpers', () => {
    it('validates IANA zones', () => {
        expect(isValidTimeZone('Europe/London')).toBe(true);
        expect(isValidTimeZone('Mars/Olympus')).toBe(false);
        expect(isValidTimeZone('')).toBe(false);
    });

    it('parses clock strings strictly', () => {
        expect(parseClock('09:30')).toBe(570);
        expect(parseClock('24:00')).toBe(1440);
        expect(() => parseClock('24:30')).toThrow();
        expect(() => parseClock('9am')).toThrow();
    });

    it('labels UTC offsets with DST awareness', () => {
        const winter = Date.parse('2026-01-15T12:00:00Z');
        const summer = Date.parse('2026-07-15T12:00:00Z');
        expect(utcOffsetLabel('Europe/London', winter)).toBe('UTC');
        expect(utcOffsetLabel('Europe/London', summer)).toBe('UTC+1');
        expect(utcOffsetLabel('America/Sao_Paulo', summer)).toBe('UTC−3');
        expect(utcOffsetLabel('Asia/Kolkata', summer)).toBe('UTC+5:30');
    });

    it('finds the next DST transition', () => {
        const t = nextDstTransition('America/New_York', Date.parse('2026-10-29T00:00:00Z'));
        expect(t).not.toBeNull();
        expect(iso(t!.at)).toBe('2026-11-01T06:00:00.000Z');
        expect(t!.offsetChangeMinutes).toBe(-60);
        expect(nextDstTransition('Asia/Tokyo', Date.parse('2026-10-29T00:00:00Z'))).toBeNull();
    });

    it('reports fractional local hours', () => {
        expect(localHour(Date.parse('2026-07-01T03:30:00Z'), 'Asia/Kolkata')).toBe(9);
    });

    it('lists local dates and merges intervals', () => {
        const from = DateTime.fromISO('2026-11-01T00:00', { zone: 'America/New_York' }).toMillis();
        expect(datesBetween(from, from + 3 * 86_400_000, 'America/New_York')).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
        expect(mergeIntervals([{ start: 5, end: 10 }, { start: 0, end: 5 }, { start: 20, end: 30 }])).toEqual([
            { start: 0, end: 10 },
            { start: 20, end: 30 },
        ]);
    });
});
