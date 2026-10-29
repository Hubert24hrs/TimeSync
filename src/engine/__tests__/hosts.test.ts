import { DateTime } from 'luxon';
import { bookableSlots, chooseHost, slotBadges, type EventContext, type HostContext } from '../booking';
import type { EventType } from '../types';

const NY = 'America/New_York';
const at = (s: string) => DateTime.fromISO(s, { zone: NY }).toMillis();
const day = { from: at('2026-11-02T00:00'), to: at('2026-11-03T00:00') }; // Monday
const now = at('2026-10-01T00:00');

const host = (id: string, weekly: Record<number, { start: string; end: string }[]>, extra: Partial<HostContext> = {}): HostContext => ({
    participant: { id, name: id, timezone: NY },
    schedule: { id: `s-${id}`, name: 'h', timezone: NY, weekly, overrides: [] },
    busy: [],
    bookingsOfType: [],
    load: 0,
    ...extra,
});

const eventType = (overrides: Partial<EventType>): EventType => ({
    id: 'et', ownerId: 'a', slug: 'x', title: 'X', kind: 'one_on_one', durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0,
    minimumNoticeMinutes: 0, location: { kind: 'google_meet' }, color: '#000000', scheduleId: 's', hostIds: ['a'], questions: [], active: true, ...overrides,
});

const ctx = (et: EventType, hosts: HostContext[]): EventContext => ({ eventType: et, hosts });
const hours = (slots: { start: number }[]) => slots.map((s) => DateTime.fromMillis(s.start, { zone: NY }).toFormat('HH:mm'));

describe('server slot computation', () => {
    it('collective events need every host free', () => {
        const c = ctx(eventType({ kind: 'collective', hostIds: ['a', 'b'] }), [
            host('a', { 1: [{ start: '09:00', end: '12:00' }] }),
            host('b', { 1: [{ start: '10:00', end: '14:00' }] }),
        ]);
        expect(hours(bookableSlots(c, day.from, day.to, now))).toEqual(['10:00', '11:00']);
    });

    it('round-robin offers any free host and picks the least loaded', () => {
        const c = ctx(eventType({ kind: 'round_robin', hostIds: ['a', 'b'] }), [
            host('a', { 1: [{ start: '09:00', end: '11:00' }] }, { load: 3 }),
            host('b', { 1: [{ start: '10:00', end: '12:00' }] }, { load: 1 }),
        ]);
        const slots = bookableSlots(c, day.from, day.to, now);
        expect(hours(slots)).toEqual(['09:00', '10:00', '11:00']);
        expect(chooseHost(c, slots[0])).toBe('a');
        expect(chooseHost(c, slots[1])).toBe('b');
    });

    it('group events keep a slot open until seats run out', () => {
        const ten = { start: at('2026-11-02T10:00'), end: at('2026-11-02T11:00') };
        const c = ctx(eventType({ kind: 'group', seats: 2 }), [host('a', { 1: [{ start: '09:00', end: '12:00' }] }, { bookingsOfType: [ten] })]);
        const slots = bookableSlots(c, day.from, day.to, now);
        expect(slots.find((s) => s.start === ten.start)?.seatsLeft).toBe(1);
        c.hosts[0].bookingsOfType = [ten, ten];
        expect(bookableSlots(c, day.from, day.to, now).some((s) => s.start === ten.start)).toBe(false);
    });

    it('scores slots from the invitee’s perspective', () => {
        const c = ctx(eventType({}), [host('a', { 1: [{ start: '09:00', end: '12:00' }] })]);
        const slot = bookableSlots(c, day.from, day.to, now)[0];
        expect(slotBadges(c, slot, NY).fairness).toBe(100);
        expect(slotBadges(c, slot, 'Asia/Tokyo').fairness).toBeLessThan(50); // 23:00 in Tokyo
    });
});
