import { bookingRequestSchema, eventTypeSchema, scheduleSchema } from '../validation';

const booking = {
    username: 'alex',
    eventSlug: 'intro-call',
    start: '2026-11-04T14:00:00Z',
    name: 'Sam Lee',
    email: 'sam@example.com',
    timezone: 'Asia/Tokyo',
};

describe('validation', () => {
    it('accepts a valid booking request and defaults answers', () => {
        const parsed = bookingRequestSchema.parse(booking);
        expect(parsed.answers).toEqual({});
    });

    it('rejects bad zones, emails, slugs and filled honeypots', () => {
        expect(bookingRequestSchema.safeParse({ ...booking, timezone: 'Nowhere/City' }).success).toBe(false);
        expect(bookingRequestSchema.safeParse({ ...booking, email: 'nope' }).success).toBe(false);
        expect(bookingRequestSchema.safeParse({ ...booking, eventSlug: '../admin' }).success).toBe(false);
        expect(bookingRequestSchema.safeParse({ ...booking, website: 'spam.example' }).success).toBe(false);
    });

    it('validates schedules and event types', () => {
        expect(scheduleSchema.safeParse({ name: 'Hours', timezone: 'UTC', weekly: { '1': [{ start: '09:00', end: '17:00' }] }, overrides: [] }).success).toBe(true);
        expect(scheduleSchema.safeParse({ name: 'Hours', timezone: 'UTC', weekly: { '1': [{ start: '17:00', end: '09:00' }] }, overrides: [] }).success).toBe(false);
        const et = {
            title: 'Intro', slug: 'intro', kind: 'one_on_one', durationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 10,
            minimumNoticeMinutes: 240, location: { kind: 'google_meet' }, color: '#7C5CFF', questions: [],
        };
        expect(eventTypeSchema.safeParse(et).success).toBe(true);
        expect(eventTypeSchema.safeParse({ ...et, durationMinutes: 2 }).success).toBe(false);
    });
});
