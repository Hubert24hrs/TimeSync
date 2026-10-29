import { DateTime } from 'luxon';
import { availableSlots, defaultWeeklyHours, groupByDay, intersectSlots, openWindows, rangesForDate, unionSlots } from '../availability';
import type { AvailabilitySchedule, EventTypeRules } from '../types';

const NY = 'America/New_York';
const at = (local: string, zone = NY) => DateTime.fromISO(local, { zone }).toMillis();
const iso = (ms: number) => new Date(ms).toISOString();
const localTimes = (slots: { start: number }[], zone = NY) => slots.map((s) => DateTime.fromMillis(s.start, { zone }).toFormat('HH:mm'));

const schedule = (overrides: Partial<AvailabilitySchedule> = {}): AvailabilitySchedule => ({
    id: 's1',
    name: 'Working hours',
    timezone: NY,
    weekly: { 1: [{ start: '09:00', end: '12:00' }] }, // Mondays
    overrides: [],
    ...overrides,
});

const rules = (overrides: Partial<EventTypeRules> = {}): EventTypeRules => ({
    durationMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    minimumNoticeMinutes: 0,
    ...overrides,
});

// 2026-11-02 is a Monday (the day after US DST ends).
const MONDAY = '2026-11-02';
const dayRange = { from: at(`${MONDAY}T00:00`), to: at(`${MONDAY}T23:59`) };
const longAgo = at('2026-01-01T00:00');

describe('availableSlots', () => {
    it('offers start times across weekly hours', () => {
        const slots = availableSlots({ schedule: schedule(), rules: rules(), ...dayRange, now: longAgo });
        expect(localTimes(slots)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
    });

    it('honours a custom slot interval', () => {
        const slots = availableSlots({ schedule: schedule(), rules: rules({ durationMinutes: 60, slotIntervalMinutes: 15 }), ...dayRange, now: longAgo });
        expect(localTimes(slots)).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00']);
    });

    it('applies minimum notice', () => {
        const slots = availableSlots({ schedule: schedule(), rules: rules({ minimumNoticeMinutes: 60 }), ...dayRange, now: at(`${MONDAY}T09:10`) });
        expect(localTimes(slots)).toEqual(['10:30', '11:00', '11:30']);
    });

    it('keeps buffers clear around busy time', () => {
        const busy = [{ start: at(`${MONDAY}T10:00`), end: at(`${MONDAY}T10:30`) }];
        const slots = availableSlots({ schedule: schedule(), rules: rules({ bufferBeforeMinutes: 15, bufferAfterMinutes: 15 }), busy, ...dayRange, now: longAgo });
        expect(localTimes(slots)).toEqual(['09:00', '11:00', '11:30']);
    });

    it('enforces the daily cap', () => {
        const booked = [{ start: at(`${MONDAY}T11:00`), end: at(`${MONDAY}T11:30`) }];
        const slots = availableSlots({ schedule: schedule(), rules: rules({ maxPerDay: 1 }), bookingsOfType: booked, ...dayRange, now: longAgo });
        expect(slots).toHaveLength(0);
        const slots2 = availableSlots({ schedule: schedule(), rules: rules({ maxPerDay: 2 }), bookingsOfType: booked, ...dayRange, now: longAgo });
        expect(slots2.length).toBeGreaterThan(0);
    });

    it('limits booking to the rolling window', () => {
        const from = at('2026-11-02T00:00');
        const slots = availableSlots({ schedule: schedule(), rules: rules({ rollingWindowDays: 7 }), from, to: from + 30 * 86_400_000, now: from });
        const days = new Set(slots.map((s) => DateTime.fromMillis(s.start, { zone: NY }).toISODate()));
        expect([...days]).toEqual(['2026-11-02']);
    });

    it('uses date overrides over weekly hours', () => {
        const blocked = schedule({ overrides: [{ date: MONDAY, ranges: [] }] });
        expect(availableSlots({ schedule: blocked, rules: rules(), ...dayRange, now: longAgo })).toHaveLength(0);

        const custom = schedule({ overrides: [{ date: MONDAY, ranges: [{ start: '14:00', end: '15:00' }] }] });
        expect(localTimes(availableSlots({ schedule: custom, rules: rules(), ...dayRange, now: longAgo }))).toEqual(['14:00', '14:30']);
        expect(rangesForDate(custom, '2026-11-09')).toEqual([{ start: '09:00', end: '12:00' }]);
    });

    it('rejects non-positive durations', () => {
        expect(() => availableSlots({ schedule: schedule(), rules: rules({ durationMinutes: 0 }), ...dayRange, now: longAgo })).toThrow();
    });
});

describe('availability across DST', () => {
    const weekdays = schedule({ weekly: defaultWeeklyHours('09:00', '17:00') });

    it('keeps local 09:00 while the UTC instant moves', () => {
        const from = at('2026-10-30T00:00');
        const slots = availableSlots({ schedule: weekdays, rules: rules({ durationMinutes: 60 }), from, to: at('2026-11-03T00:00'), now: longAgo });
        const firstPerDay = groupByDay(slots, NY).map((d) => iso(d.slots[0].start));
        expect(firstPerDay).toEqual(['2026-10-30T13:00:00.000Z', '2026-11-02T14:00:00.000Z']); // Fri EDT, Mon EST
    });

    it('a window spanning the spring-forward gap is one hour shorter', () => {
        const sunday = schedule({ weekly: { 7: [{ start: '01:00', end: '04:00' }] } });
        const windows = openWindows(sunday, at('2026-03-08T00:00'), at('2026-03-09T00:00'));
        expect(windows.map((w) => [iso(w.start), iso(w.end)])).toEqual([['2026-03-08T06:00:00.000Z', '2026-03-08T08:00:00.000Z']]);
        const slots = availableSlots({ schedule: sunday, rules: rules({ durationMinutes: 60 }), from: at('2026-03-08T00:00'), to: at('2026-03-09T00:00'), now: longAgo });
        expect(localTimes(slots)).toEqual(['01:00', '03:00']);
    });

    it('a window spanning the fall-back repeat is one hour longer', () => {
        const sunday = schedule({ weekly: { 7: [{ start: '00:00', end: '03:00' }] } });
        const slots = availableSlots({ schedule: sunday, rules: rules({ durationMinutes: 60 }), from: at('2026-11-01T00:00'), to: at('2026-11-02T00:00'), now: longAgo });
        expect(slots.map((s) => iso(s.start))).toEqual([
            '2026-11-01T04:00:00.000Z',
            '2026-11-01T05:00:00.000Z',
            '2026-11-01T06:00:00.000Z',
            '2026-11-01T07:00:00.000Z',
        ]);
        expect(localTimes(slots)).toEqual(['00:00', '01:00', '01:00', '02:00']);
    });

    it('shows slots on the invitee’s own calendar date', () => {
        const slots = availableSlots({ schedule: schedule(), rules: rules({ durationMinutes: 60 }), ...dayRange, now: longAgo });
        const tokyo = groupByDay(slots, 'Asia/Tokyo');
        // 09:00–11:00 EST Monday = 23:00 Monday – 01:00 Tuesday in Tokyo.
        expect(tokyo.map((d) => d.date)).toEqual(['2026-11-02', '2026-11-03']);
        expect(tokyo[0].slots[0].label).toBe('11:00 PM');
        expect(tokyo[1].slots.map((s) => s.label)).toEqual(['12:00 AM', '1:00 AM']);
    });

    it('supports an end of 24:00', () => {
        const late = schedule({ weekly: { 1: [{ start: '23:00', end: '24:00' }] } });
        const slots = availableSlots({ schedule: late, rules: rules(), ...dayRange, to: at('2026-11-03T00:00'), now: longAgo });
        expect(localTimes(slots)).toEqual(['23:00', '23:30']);
    });
});

describe('multi-host slot sets', () => {
    const a = [{ start: 1, end: 2 }, { start: 3, end: 4 }];
    const b = [{ start: 3, end: 4 }, { start: 5, end: 6 }];

    it('intersects for collective events', () => {
        expect(intersectSlots([a, b])).toEqual([{ start: 3, end: 4 }]);
        expect(intersectSlots([])).toEqual([]);
    });

    it('unions for round-robin with free hosts per slot', () => {
        expect(unionSlots([{ hostId: 'a', slots: a }, { hostId: 'b', slots: b }])).toEqual([
            { start: 1, end: 2, hostIds: ['a'] },
            { start: 3, end: 4, hostIds: ['a', 'b'] },
            { start: 5, end: 6, hostIds: ['b'] },
        ]);
    });
});
