import { DateTime } from 'luxon';
import { defaultWeeklyHours, detectTimeZone, findOptimalSlots, scoreSlot, type Participant } from '../engine';
import type { AvailabilitySchedule, Booking, EventType, Poll, Profile, RoutingFormRecord, Webhook } from '../types';

// Demo workspace: a realistic global team so every feature can be explored without a backend.

export const DEMO_USER_ID = 'demo-me';

export function demoMe(timezone = detectTimeZone()): Profile {
    return {
        id: DEMO_USER_ID,
        username: 'alex',
        name: 'Alex Chen',
        email: 'alex@timesync.app',
        timezone,
        chronotype: 'wolf',
        countryCode: 'US',
        workingHours: { start: 9, end: 17 },
        role: 'Engineering Manager',
        status: 'online',
    };
}

export const demoTeam: Profile[] = [
    { id: 'tm-sarah', username: 'sarah', name: 'Sarah Johnson', email: 'sarah@timesync.app', timezone: 'America/New_York', chronotype: 'lion', countryCode: 'US', workingHours: { start: 8, end: 16 }, role: 'Product Manager', latitude: 40.7, longitude: -74.0, status: 'online' },
    { id: 'tm-james', username: 'james', name: 'James Williams', email: 'james@timesync.app', timezone: 'Europe/London', chronotype: 'bear', countryCode: 'GB', workingHours: { start: 9, end: 17.5 }, role: 'Backend Developer', latitude: 51.5, longitude: -0.1, status: 'online' },
    { id: 'tm-yuki', username: 'yuki', name: 'Yuki Tanaka', email: 'yuki@timesync.app', timezone: 'Asia/Tokyo', chronotype: 'dolphin', countryCode: 'JP', workingHours: { start: 10, end: 19 }, role: 'UI Designer', latitude: 35.7, longitude: 139.7, status: 'away' },
    { id: 'tm-priya', username: 'priya', name: 'Priya Sharma', email: 'priya@timesync.app', timezone: 'Asia/Kolkata', chronotype: 'bear', countryCode: 'IN', workingHours: { start: 9.5, end: 18 }, role: 'ML Engineer', latitude: 28.6, longitude: 77.2, status: 'online' },
    { id: 'tm-carlos', username: 'carlos', name: 'Carlos Santos', email: 'carlos@timesync.app', timezone: 'America/Sao_Paulo', chronotype: 'wolf', countryCode: 'BR', workingHours: { start: 10, end: 19 }, role: 'iOS Developer', latitude: -23.5, longitude: -46.6, status: 'away' },
    { id: 'tm-fatima', username: 'fatima', name: 'Fatima Al-Rahman', email: 'fatima@timesync.app', timezone: 'Asia/Riyadh', chronotype: 'lion', countryCode: 'SA', workingHours: { start: 8, end: 16 }, role: 'QA Lead', latitude: 24.7, longitude: 46.7, status: 'offline' },
    { id: 'tm-emma', username: 'emma', name: 'Emma Davis', email: 'emma@timesync.app', timezone: 'Australia/Sydney', chronotype: 'bear', countryCode: 'AU', workingHours: { start: 9, end: 17 }, role: 'Frontend Developer', latitude: -33.9, longitude: 151.2, status: 'offline' },
    { id: 'tm-kwame', username: 'kwame', name: 'Kwame Asante', email: 'kwame@timesync.app', timezone: 'Africa/Lagos', chronotype: 'lion', countryCode: 'NG', workingHours: { start: 8, end: 17 }, role: 'DevOps Engineer', latitude: 6.5, longitude: 3.4, status: 'online' },
];

export function toParticipant(p: Profile): Participant {
    return { id: p.id, name: p.name, timezone: p.timezone, chronotype: p.chronotype, countryCode: p.countryCode, workingHours: p.workingHours };
}

export function demoSchedules(timezone: string): AvailabilitySchedule[] {
    return [
        { id: 'sch-work', name: 'Working hours', timezone, weekly: defaultWeeklyHours('09:00', '17:00'), overrides: [] },
        {
            id: 'sch-evening',
            name: 'Evenings (APAC calls)',
            timezone,
            weekly: { 1: [{ start: '18:00', end: '21:00' }], 3: [{ start: '18:00', end: '21:00' }] },
            overrides: [],
        },
    ];
}

const base = {
    ownerId: DEMO_USER_ID,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 0,
    minimumNoticeMinutes: 240,
    rollingWindowDays: 60,
    active: true,
};

export const demoEventTypes: EventType[] = [
    {
        ...base,
        id: 'et-intro',
        slug: 'intro',
        title: 'Intro call',
        description: 'A quick 30-minute call to get to know each other.',
        kind: 'one_on_one',
        durationMinutes: 30,
        bufferAfterMinutes: 10,
        maxPerDay: 4,
        location: { kind: 'google_meet' },
        color: '#7C5CFF',
        scheduleId: 'sch-work',
        hostIds: [DEMO_USER_ID],
        questions: [{ id: 'q-agenda', label: 'What would you like to discuss?', type: 'textarea', required: false }],
    },
    {
        ...base,
        id: 'et-deep',
        slug: 'deep-dive',
        title: 'Technical deep dive',
        description: 'An hour to go deep on architecture or a hard problem.',
        kind: 'one_on_one',
        durationMinutes: 60,
        bufferAfterMinutes: 15,
        minimumNoticeMinutes: 1440,
        location: { kind: 'zoom', value: 'https://zoom.us/j/0000000000' },
        color: '#22D3EE',
        scheduleId: 'sch-work',
        hostIds: [DEMO_USER_ID],
        questions: [
            { id: 'q-company', label: 'Company', type: 'text', required: true },
            { id: 'q-topic', label: 'Topic', type: 'select', required: true, options: ['Architecture', 'Performance', 'Hiring'] },
        ],
    },
    {
        ...base,
        id: 'et-support',
        slug: 'support',
        title: 'Customer support (round-robin)',
        kind: 'round_robin',
        durationMinutes: 30,
        bufferAfterMinutes: 5,
        location: { kind: 'google_meet' },
        color: '#2EE6A6',
        scheduleId: 'sch-work',
        hostIds: [DEMO_USER_ID, 'tm-james', 'tm-kwame'],
        questions: [],
    },
    {
        ...base,
        id: 'et-office',
        slug: 'office-hours',
        title: 'Office hours (group)',
        kind: 'group',
        seats: 8,
        durationMinutes: 45,
        bufferAfterMinutes: 0,
        location: { kind: 'google_meet' },
        color: '#FF5CAA',
        scheduleId: 'sch-evening',
        hostIds: [DEMO_USER_ID],
        questions: [],
        active: false,
    },
];

const INVITEES = [
    ['Maya Patel', 'maya@example.com', 'Asia/Kolkata'],
    ['Lukas Becker', 'lukas@example.com', 'Europe/Berlin'],
    ['Sofia Rossi', 'sofia@example.com', 'Europe/Rome'],
    ['Chen Wei', 'chen@example.com', 'Asia/Shanghai'],
    ['Amara Okafor', 'amara@example.com', 'Africa/Lagos'],
    ['Diego Lopez', 'diego@example.com', 'America/Mexico_City'],
    ['Hana Kim', 'hana@example.com', 'Asia/Seoul'],
    ['Noah Smith', 'noah@example.com', 'America/Los_Angeles'],
] as const;

/** Bookings spread over the last two weeks and the next week, in the host's working hours. */
export function demoBookings(me: Profile, now = Date.now()): Booking[] {
    const out: Booking[] = [];
    const zone = me.timezone;
    const plan = [-12, -10, -9, -7, -5, -3, -2, -1, 0, 0, 1, 2, 3, 5, 6];
    plan.forEach((dayOffset, i) => {
        let day = DateTime.fromMillis(now, { zone }).plus({ days: dayOffset });
        while (day.weekday > 5) day = day.plus({ days: 1 });
        const et = demoEventTypes[i % 3];
        const hour = [9, 10.5, 13, 14.5, 16, 19][i % 6];
        const start = day.startOf('day').plus({ minutes: hour * 60 }).toMillis();
        const end = start + et.durationMinutes * 60_000;
        const [name, email, tz] = INVITEES[i % INVITEES.length];
        const score = scoreSlot([toParticipant(me), { id: 'inv', name, timezone: tz }], { start, end });
        const status: Booking['status'] = end < now ? (i === 3 ? 'no_show' : i === 5 ? 'cancelled' : 'completed') : 'confirmed';
        out.push({
            id: `bk-${i}`,
            eventTypeId: et.id,
            hostId: et.kind === 'round_robin' ? et.hostIds[i % et.hostIds.length] : DEMO_USER_ID,
            inviteeName: name,
            inviteeEmail: email,
            inviteeTimezone: tz,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            status,
            meetingUrl: et.location.kind === 'zoom' ? et.location.value : `https://meet.google.com/demo-${i}`,
            fairnessScore: score.fairnessScore,
            createdAt: new Date(start - 3 * 86_400_000).toISOString(),
        });
    });
    return out.sort((a, b) => a.start.localeCompare(b.start));
}

export function demoPolls(me: Profile, now = Date.now()): Poll[] {
    const people = [me, demoTeam[1], demoTeam[3], demoTeam[7]];
    const slots = findOptimalSlots(people.map(toParticipant), { durationMinutes: 60, from: now + 86_400_000, to: now + 6 * 86_400_000, limit: 4, minGapMinutes: 240 });
    const options = slots.map((s, i) => ({ id: `po-${i}`, start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString() }));
    const answers: Poll['votes'][number]['answer'][][] = [
        ['yes', 'maybe', 'no', 'yes'],
        ['yes', 'yes', 'maybe', 'no'],
        ['maybe', 'yes', 'yes', 'no'],
    ];
    return [
        {
            id: 'poll-q1',
            title: 'Q1 planning kickoff',
            durationMinutes: 60,
            status: 'open',
            participantIds: people.map((p) => p.id),
            options,
            votes: answers.flatMap((row, v) => row.slice(0, options.length).map((answer, o) => ({ voterId: people[v + 1].id, optionId: options[o].id, answer }))),
            createdAt: new Date(now - 86_400_000).toISOString(),
        },
    ];
}

export const demoRoutingForms: RoutingFormRecord[] = [
    {
        id: 'rf-sales',
        slug: 'contact',
        title: 'Talk to us',
        questions: [
            { id: 'size', label: 'Team size', options: ['1-10', '11-100', '100+'] },
            { id: 'need', label: 'What do you need?', options: ['Product demo', 'Technical question', 'Support'] },
        ],
        form: {
            id: 'rf-sales',
            rules: [
                { id: 'r1', when: [{ questionId: 'need', op: 'equals', value: 'Support' }], then: { type: 'event_type', eventTypeId: 'et-support' } },
                { id: 'r2', when: [{ questionId: 'need', op: 'equals', value: 'Technical question' }], then: { type: 'event_type', eventTypeId: 'et-deep' } },
            ],
            fallback: { type: 'event_type', eventTypeId: 'et-intro' },
        },
    },
];

export const demoWebhooks: Webhook[] = [{ id: 'wh-1', url: 'https://hooks.zapier.com/hooks/catch/000000/demo', events: ['booking.created', 'booking.cancelled'], active: true }];
