import { DateTime } from 'luxon';
import { findOptimalSlots, hourPenalty, overlapHeatmap, participantSlot, rankByEnergy, scoreSlot } from '../optimizer';
import type { Participant } from '../types';

const HOUR = 3_600_000;
const utc = (s: string) => Date.parse(s);

const ny: Participant = { id: 'ny', name: 'Sarah NY', timezone: 'America/New_York', chronotype: 'lion', countryCode: 'US' };
const london: Participant = { id: 'ldn', name: 'James London', timezone: 'Europe/London', chronotype: 'bear', countryCode: 'GB' };
const tokyo: Participant = { id: 'tyo', name: 'Yuki Tokyo', timezone: 'Asia/Tokyo', chronotype: 'dolphin', countryCode: 'JP' };
const riyadh: Participant = { id: 'ruh', name: 'Fatima Riyadh', timezone: 'Asia/Riyadh', chronotype: 'lion', countryCode: 'SA' };

describe('hourPenalty', () => {
    it('grades inconvenience by local hour', () => {
        expect(hourPenalty(10)).toEqual({ penalty: 0, band: 'ideal' });
        expect(hourPenalty(8).band).toBe('stretch');
        expect(hourPenalty(18).band).toBe('stretch');
        expect(hourPenalty(22).band).toBe('unsocial');
        expect(hourPenalty(6.5).band).toBe('unsocial');
        expect(hourPenalty(2)).toEqual({ penalty: 1, band: 'night' });
        expect(hourPenalty(8).penalty).toBeLessThan(hourPenalty(22).penalty);
    });

    it('respects custom working hours', () => {
        expect(hourPenalty(19, { start: 12, end: 20 }).band).toBe('ideal');
    });
});

describe('participantSlot', () => {
    it('flags regional weekends (Sun–Thu workweek)', () => {
        // Friday 2026-11-06 10:00 Riyadh is the weekend; Sunday is a workday.
        const friday = { start: utc('2026-11-06T07:00:00Z'), end: utc('2026-11-06T08:00:00Z') };
        const sunday = { start: utc('2026-11-08T07:00:00Z'), end: utc('2026-11-08T08:00:00Z') };
        expect(participantSlot(riyadh, friday).band).toBe('off_day');
        expect(participantSlot(riyadh, sunday).band).toBe('ideal');
        expect(participantSlot(london, sunday).band).toBe('off_day');
    });

    it('flags public holidays in the participant’s country', () => {
        // US Thanksgiving 2026-11-26, 11:00 New York.
        const slot = { start: utc('2026-11-26T16:00:00Z'), end: utc('2026-11-26T17:00:00Z') };
        const info = participantSlot(ny, slot);
        expect(info.band).toBe('holiday');
        expect(info.holiday).toBe('Thanksgiving');
        expect(participantSlot(london, slot).band).toBe('ideal');
    });

    it('averages penalty over the meeting', () => {
        // 16:30–17:30 London: half inside, half just after hours.
        const slot = { start: utc('2026-11-04T16:30:00Z'), end: utc('2026-11-04T17:30:00Z') };
        const info = participantSlot(london, slot);
        expect(info.band).toBe('stretch');
        expect(info.penalty).toBeGreaterThan(0);
        expect(info.penalty).toBeLessThan(0.2);
    });
});

describe('scoreSlot', () => {
    it('scores a slot inside everyone’s hours as perfectly fair', () => {
        const slot = { start: utc('2026-11-04T14:00:00Z'), end: utc('2026-11-04T15:00:00Z') }; // 9 NY, 14 London
        const s = scoreSlot([ny, london], slot);
        expect(s.fairnessScore).toBe(100);
        expect(s.pros).toContain('Inside working hours for everyone');
        expect(s.cons).toHaveLength(0);
    });

    it('penalises the worst-off attendee', () => {
        const good = scoreSlot([ny, london], { start: utc('2026-11-04T14:00:00Z'), end: utc('2026-11-04T15:00:00Z') });
        const bad = scoreSlot([ny, london], { start: utc('2026-11-04T05:00:00Z'), end: utc('2026-11-04T06:00:00Z') }); // midnight NY
        expect(bad.fairnessScore).toBeLessThan(good.fairnessScore - 40);
        expect(bad.cons[0]).toMatch(/Night-time for Sarah/);
    });

    it('rotates pain using history: prefers burdening the person who has suffered least', () => {
        const tokyoHurts = { start: utc('2026-11-05T13:00:00Z'), end: utc('2026-11-05T14:00:00Z') }; // 08:00 NY, 22:00 Tokyo
        const nyHurts = { start: utc('2026-11-06T02:00:00Z'), end: utc('2026-11-06T03:00:00Z') }; // 21:00 NY, 11:00 Tokyo
        const gap = (history?: Record<string, number>) =>
            scoreSlot([ny, tokyo], nyHurts, { history }).fairnessScore - scoreSlot([ny, tokyo], tokyoHurts, { history }).fairnessScore;
        // Tokyo has carried the late calls so far: making NY stay late now becomes clearly fairer.
        expect(gap({ ny: 0, tyo: 5 })).toBeGreaterThan(gap() + 5);
        expect(scoreSlot([ny, tokyo], nyHurts, { history: { ny: 0, tyo: 5 } }).pros).toContain('Rotates inconvenience fairly');
    });

    it('treats optional attendees more leniently', () => {
        const slot = { start: utc('2026-11-04T05:00:00Z'), end: utc('2026-11-04T06:00:00Z') };
        const required = scoreSlot([london, { ...ny }], slot);
        const optional = scoreSlot([london, { ...ny, optional: true }], slot);
        expect(optional.fairnessScore).toBeGreaterThan(required.fairnessScore);
    });
});

describe('findOptimalSlots', () => {
    const from = utc('2026-11-04T00:00:00Z'); // Wednesday
    const to = utc('2026-11-05T00:00:00Z');

    it('finds the NY/London overlap as the best slots', () => {
        const best = findOptimalSlots([ny, london], { durationMinutes: 60, from, to, limit: 10 });
        expect(DateTime.fromMillis(best[0].start, { zone: ny.timezone }).toFormat('HH:mm')).toBe('09:00');
        expect(best[0].fairnessScore).toBe(100);
        for (const s of best.filter((x) => x.fairnessScore === 100)) {
            const nyHour = DateTime.fromMillis(s.start, { zone: ny.timezone }).hour;
            expect(nyHour).toBeGreaterThanOrEqual(9);
            expect(nyHour).toBeLessThan(12); // London closes at 17:00 = 12:00 NY in November
        }
    });

    it('skips slots where a required attendee is busy', () => {
        const busyNy = { ...ny, busy: [{ start: utc('2026-11-04T14:00:00Z'), end: utc('2026-11-04T17:00:00Z') }] };
        const best = findOptimalSlots([busyNy, london], { durationMinutes: 60, from, to, limit: 50 });
        expect(best.every((s) => s.end <= utc('2026-11-04T14:00:00Z') || s.start >= utc('2026-11-04T17:00:00Z'))).toBe(true);
    });

    it('can exclude night-time slots entirely and keep suggestions apart', () => {
        const best = findOptimalSlots([ny, london, tokyo], { durationMinutes: 60, from, to, excludeNight: true, minGapMinutes: 120, limit: 5 });
        expect(best.length).toBeGreaterThan(0);
        expect(best.every((s) => s.participants.every((p) => p.band !== 'night'))).toBe(true);
        for (let i = 0; i < best.length; i++) {
            for (let j = i + 1; j < best.length; j++) expect(Math.abs(best[i].start - best[j].start)).toBeGreaterThanOrEqual(2 * HOUR);
        }
    });

    it('results are sorted by overall score', () => {
        const best = findOptimalSlots([ny, london, tokyo], { durationMinutes: 30, from, to, limit: 10 });
        for (let i = 1; i < best.length; i++) expect(best[i - 1].score).toBeGreaterThanOrEqual(best[i].score);
    });

    it('validates duration', () => {
        expect(() => findOptimalSlots([ny], { durationMinutes: 0, from, to })).toThrow();
    });

    it('tracks the DST shift in the NY–London overlap (US/UK change on different dates)', () => {
        const perfect = (d: string) => findOptimalSlots([ny, london], { durationMinutes: 60, from: utc(`${d}T00:00:00Z`), to: utc(`${d}T23:59:00Z`), limit: 100 })
            .filter((s) => s.fairnessScore === 100)
            .map((s) => DateTime.fromMillis(s.start, { zone: ny.timezone }).toFormat('HH:mm'))
            .sort();
        // 2026-03-04: both on standard time, 5h apart → overlap 09:00–12:00 NY.
        expect(perfect('2026-03-04')).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
        // 2026-03-16: US on EDT (since 8 Mar), UK still on GMT (until 29 Mar) → 4h apart → overlap 09:00–13:00 NY.
        expect(perfect('2026-03-16')).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00']);
    });
});

describe('energy ranking and heatmap', () => {
    it('ranks slots by team energy', () => {
        const morning = { start: utc('2026-11-04T13:00:00Z'), end: utc('2026-11-04T14:00:00Z') }; // 8 NY
        const evening = { start: utc('2026-11-04T23:00:00Z'), end: utc('2026-11-05T00:00:00Z') }; // 18 NY
        const ranked = rankByEnergy([ny], [evening, morning]);
        expect(ranked[0].start).toBe(morning.start); // lions peak in the morning
    });

    it('counts participants in working hours per viewer hour', () => {
        const heat = overlapHeatmap([ny, london], '2026-11-04', 'America/New_York');
        expect(heat).toHaveLength(24);
        expect(heat[10].available).toBe(2);
        expect(heat[3].available).toBe(0);
        expect(heat[14].available).toBe(1);
    });
});
