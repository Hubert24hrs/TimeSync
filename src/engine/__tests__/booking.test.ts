/**
 * @jest-environment node
 */
import { computeAnalytics } from '../analytics';
import { holidayOn, holidaysBetween, isWorkday, workweekLabel } from '../culture';
import { buildIcs } from '../ics';
import { pollHeat, pollWinner, tallyPoll } from '../polls';
import { canMarkNoShow, planReminders, DEFAULT_REMINDER_POLICY } from '../reminders';
import { pickHost } from '../roundRobin';
import { route, type RoutingForm } from '../routing';
import { signLink, verifyLink } from '../signedLinks';
import type { Booking } from '../types';

const SECRET = 'test-secret-that-is-definitely-long-enough-123';

describe('signed links', () => {
    it('round-trips valid claims', async () => {
        const token = await signLink({ sub: 'bk_1', action: 'manage', exp: 2_000_000_000 }, SECRET);
        expect(await verifyLink(token, SECRET, 1_900_000_000)).toEqual({ sub: 'bk_1', action: 'manage', exp: 2_000_000_000 });
    });

    it('rejects tampering, wrong secrets, expiry and junk', async () => {
        const token = await signLink({ sub: 'bk_1', action: 'manage', exp: 2_000_000_000 }, SECRET);
        const [payload, sig] = token.split('.');
        const forged = Buffer.from(JSON.stringify({ sub: 'bk_2', action: 'manage', exp: 2_000_000_000 })).toString('base64url');
        expect(await verifyLink(`${forged}.${sig}`, SECRET, 0)).toBeNull();
        expect(await verifyLink(token, SECRET.replace('1', '2'), 0)).toBeNull();
        expect(await verifyLink(token, SECRET, 2_000_000_001)).toBeNull();
        expect(await verifyLink(`${payload}`, SECRET, 0)).toBeNull();
        expect(await verifyLink(`${payload}.${sig}.x`, SECRET, 0)).toBeNull();
        expect(await verifyLink('%%%.###', SECRET, 0)).toBeNull();
    });

    it('refuses weak secrets', async () => {
        await expect(signLink({ sub: 'x', action: 'book', exp: 1 }, 'short')).rejects.toThrow();
    });
});

describe('round-robin', () => {
    it('balances load, then priority, then recency', () => {
        const loads = [
            { hostId: 'a', bookings: 3 },
            { hostId: 'b', bookings: 1, lastAssignedAt: 200 },
            { hostId: 'c', bookings: 1, lastAssignedAt: 100 },
            { hostId: 'd', bookings: 1, priority: 1, lastAssignedAt: 300 },
        ];
        expect(pickHost(loads, ['a', 'b', 'c', 'd'])).toBe('d');
        expect(pickHost(loads, ['a', 'b', 'c'])).toBe('c');
        expect(pickHost(loads, ['a'])).toBe('a');
        expect(pickHost(loads, [])).toBeNull();
    });

    it('weights part-time hosts', () => {
        expect(pickHost([{ hostId: 'full', bookings: 2 }, { hostId: 'half', bookings: 2, weight: 0.5 }], ['full', 'half'])).toBe('full');
    });
});

describe('polls', () => {
    const options = [
        { id: 'o1', start: 1000, end: 2000 },
        { id: 'o2', start: 3000, end: 4000 },
        { id: 'o3', start: 5000, end: 6000 },
    ];

    it('tallies with yes = 1 and maybe = ½, latest vote wins', () => {
        const votes = [
            { voterId: 'u1', optionId: 'o1', answer: 'no' as const },
            { voterId: 'u1', optionId: 'o1', answer: 'yes' as const },
            { voterId: 'u2', optionId: 'o1', answer: 'maybe' as const },
        ];
        expect(tallyPoll(options, votes)[0]).toEqual({ optionId: 'o1', yes: 1, maybe: 1, no: 0, score: 1.5 });
    });

    it('picks the winner with tie-breaks', () => {
        const votes = [
            { voterId: 'u1', optionId: 'o2', answer: 'yes' as const },
            { voterId: 'u1', optionId: 'o3', answer: 'yes' as const },
            { voterId: 'u2', optionId: 'o3', answer: 'no' as const },
        ];
        expect(pollWinner(options, votes)?.id).toBe('o2'); // same score, fewer "no"
        expect(pollWinner(options, [])).toBeNull();
        expect(pollHeat(options, votes, 2)).toEqual({ o1: 0, o2: 0.5, o3: 0.5 });
    });
});

describe('routing forms', () => {
    const form: RoutingForm = {
        id: 'f1',
        rules: [
            { id: 'r1', when: [{ questionId: 'size', op: 'gte', value: 100 }, { questionId: 'region', op: 'in', value: ['EMEA', 'APAC'] }], then: { type: 'event_type', eventTypeId: 'enterprise-intl' } },
            { id: 'r2', when: [{ questionId: 'size', op: 'gte', value: 100 }], then: { type: 'event_type', eventTypeId: 'enterprise' } },
            { id: 'r3', when: [{ questionId: 'topic', op: 'contains', value: 'support' }], then: { type: 'url', url: 'https://help.example.com' } },
        ],
        fallback: { type: 'event_type', eventTypeId: 'intro' },
    };

    it('routes by first matching rule', () => {
        expect(route(form, { size: '500', region: 'emea' })).toEqual({ type: 'event_type', eventTypeId: 'enterprise-intl' });
        expect(route(form, { size: '500', region: 'AMER' })).toEqual({ type: 'event_type', eventTypeId: 'enterprise' });
        expect(route(form, { size: '5', topic: 'Need SUPPORT please' })).toEqual({ type: 'url', url: 'https://help.example.com' });
        expect(route(form, {})).toEqual({ type: 'event_type', eventTypeId: 'intro' });
    });
});

describe('ics export', () => {
    it('produces RFC 5545 output with escaping and folding', () => {
        const ics = buildIcs(
            [
                {
                    uid: 'bk_1@timesync.app',
                    title: 'Sync; planning, Q4',
                    start: Date.parse('2026-11-04T14:00:00Z'),
                    end: Date.parse('2026-11-04T15:00:00Z'),
                    description: 'Line one\nLine two — '.padEnd(120, 'x'),
                    organizer: { name: 'Alex', email: 'alex@example.com' },
                    attendees: [{ name: 'Sam', email: 'sam@example.com' }],
                },
            ],
            Date.parse('2026-10-29T00:00:00Z'),
        );
        expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
        expect(ics).toContain('DTSTART:20261104T140000Z');
        expect(ics).toContain('DTSTAMP:20261029T000000Z');
        expect(ics).toContain('SUMMARY:Sync\\; planning\\, Q4');
        expect(ics).toContain('DESCRIPTION:Line one\\nLine two');
        expect(ics).toContain('ATTENDEE;CN=Sam;ROLE=REQ-PARTICIPANT:mailto:sam@example.com');
        for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
        expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    });
});

describe('reminders', () => {
    const booking = { id: 'b', start: '2026-11-04T14:00:00Z', end: '2026-11-04T15:00:00Z', status: 'confirmed' as const };

    it('plans reminders and a follow-up, skipping ones already past', () => {
        const now = Date.parse('2026-11-04T00:00:00Z'); // 14h before: the 24h reminder is past
        const planned = planReminders(booking, DEFAULT_REMINDER_POLICY, now);
        expect(planned.map((p) => [p.kind, p.channel, new Date(p.sendAt).toISOString()])).toEqual([
            ['reminder', 'email', '2026-11-04T13:00:00.000Z'],
            ['reminder', 'push', '2026-11-04T13:00:00.000Z'],
            ['follow_up', 'email', '2026-11-04T15:30:00.000Z'],
        ]);
        expect(planReminders({ ...booking, status: 'cancelled' }, DEFAULT_REMINDER_POLICY, now)).toEqual([]);
    });

    it('allows no-show marking only after start, for a week', () => {
        expect(canMarkNoShow(booking, Date.parse('2026-11-04T13:59:00Z'))).toBe(false);
        expect(canMarkNoShow(booking, Date.parse('2026-11-04T14:10:00Z'))).toBe(true);
        expect(canMarkNoShow(booking, Date.parse('2026-11-12T00:00:00Z'))).toBe(false);
    });
});

describe('cultural calendar', () => {
    it('knows regional workweeks', () => {
        expect(isWorkday(7, 'IL')).toBe(true); // Sunday in Israel
        expect(isWorkday(5, 'SA')).toBe(false); // Friday in Saudi Arabia
        expect(isWorkday(5, 'AE')).toBe(true); // UAE moved to Mon–Fri in 2022
        expect(workweekLabel('SA')).toBe('Sun–Thu');
        expect(workweekLabel()).toBe('Mon–Fri');
    });

    it('lists holidays by country and date', () => {
        expect(holidayOn('2026-10-01', 'NG')?.name).toBe('Independence Day');
        expect(holidayOn('2026-10-01', 'GB')).toBeUndefined();
        expect(holidayOn('2026-12-25', 'JP')).toBeUndefined();
        expect(holidayOn('2027-01-01', 'JP')?.name).toBe("New Year's Day");
        const nov = holidaysBetween('2026-11-01', '2026-11-30', ['US']);
        expect(nov.map((h) => h.name)).toEqual(['Thanksgiving']);
        expect(holidaysBetween('2026-11-01', '2026-11-30').length).toBeGreaterThan(1);
    });
});

describe('analytics', () => {
    const mk = (id: string, start: string, end: string, extra: Partial<Booking> = {}): Booking => ({
        id, eventTypeId: 'e', hostId: 'h', inviteeName: 'I', inviteeEmail: 'i@x.com', inviteeTimezone: 'UTC', start, end, status: 'confirmed', createdAt: start, ...extra,
    });

    it('computes booked, fairness and after-hours load', () => {
        const bookings = [
            mk('1', '2026-11-04T10:00:00Z', '2026-11-04T11:00:00Z', { fairnessScore: 90 }),
            mk('2', '2026-11-04T21:00:00Z', '2026-11-04T21:30:00Z', { fairnessScore: 70 }),
            mk('3', '2026-11-11T10:00:00Z', '2026-11-11T11:00:00Z', { status: 'cancelled' }),
            mk('4', '2026-11-12T10:00:00Z', '2026-11-12T11:00:00Z', { status: 'no_show' }),
        ];
        const a = computeAnalytics(bookings, [{ id: 'h', name: 'Host', timezone: 'Europe/London' }]);
        expect(a.meetingsBooked).toBe(3);
        expect(a.cancelled).toBe(1);
        expect(a.noShows).toBe(1);
        expect(a.averageFairness).toBe(80);
        expect(a.afterHoursMinutes.h).toBe(30);
        expect(a.perWeek).toEqual([{ week: '2026-W45', count: 2 }, { week: '2026-W46', count: 1 }]);
    });
});
