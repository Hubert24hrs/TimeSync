import { z } from 'zod';
import { isValidTimeZone } from './time.ts';

// Shared input validation for the app and Edge Functions. Never trust the client: the Edge
// Functions re-validate every payload with these same schemas.

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, 'Use HH:mm');
export const timeZoneSchema = z.string().refine(isValidTimeZone, 'Unknown time zone');
const slug = z.string().min(1).max(60).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Lowercase letters, numbers and dashes only');

export const timeRangeSchema = z
    .object({ start: clock, end: clock })
    .refine((r) => r.start < r.end, 'End must be after start');

export const scheduleSchema = z.object({
    name: z.string().trim().min(1).max(80),
    timezone: timeZoneSchema,
    weekly: z.partialRecord(z.enum(['1', '2', '3', '4', '5', '6', '7']), z.array(timeRangeSchema).max(6)),
    overrides: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ranges: z.array(timeRangeSchema).max(6) })).max(366),
});

export const intakeQuestionSchema = z.object({
    id: z.string().min(1).max(40),
    label: z.string().trim().min(1).max(200),
    type: z.enum(['text', 'textarea', 'select', 'phone']),
    required: z.boolean(),
    options: z.array(z.string().max(100)).max(20).optional(),
});

export const eventTypeSchema = z.object({
    title: z.string().trim().min(1).max(120),
    slug,
    description: z.string().max(2000).optional(),
    kind: z.enum(['one_on_one', 'group', 'round_robin', 'collective']),
    durationMinutes: z.number().int().min(5).max(720),
    slotIntervalMinutes: z.number().int().min(5).max(720).optional(),
    bufferBeforeMinutes: z.number().int().min(0).max(240),
    bufferAfterMinutes: z.number().int().min(0).max(240),
    minimumNoticeMinutes: z.number().int().min(0).max(60 * 24 * 60),
    maxPerDay: z.number().int().min(1).max(100).optional(),
    rollingWindowDays: z.number().int().min(1).max(365).optional(),
    seats: z.number().int().min(2).max(500).optional(),
    location: z.object({ kind: z.enum(['google_meet', 'zoom', 'phone', 'in_person', 'custom']), value: z.string().max(500).optional() }),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    questions: z.array(intakeQuestionSchema).max(20),
});

export const bookingRequestSchema = z.object({
    username: slug,
    eventSlug: slug,
    start: z.iso.datetime({ offset: true }),
    name: z.string().trim().min(1).max(120),
    email: z.email().max(254),
    timezone: timeZoneSchema,
    answers: z.record(z.string().max(40), z.string().max(2000)).default({}),
    /** Honeypot: real browsers leave it empty. */
    website: z.string().max(0).optional(),
});

export const manageBookingSchema = z.object({
    token: z.string().min(20).max(2000),
    action: z.enum(['cancel', 'reschedule']),
    newStart: z.iso.datetime({ offset: true }).optional(),
    reason: z.string().max(500).optional(),
});

export const chatRequestSchema = z.object({
    message: z.string().trim().min(1).max(2000),
    history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })).max(20).default([]),
    context: z
        .object({ timezone: timeZoneSchema.optional(), teamZones: z.array(timeZoneSchema).max(50).optional() })
        .default({}),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
export type ManageBookingRequest = z.infer<typeof manageBookingSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type EventTypeInput = z.infer<typeof eventTypeSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
