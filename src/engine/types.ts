// Pure domain types shared by the app (Metro), tests (Jest) and Supabase Edge Functions (Deno).
// Keep this folder free of React / React Native imports, and use explicit `.ts` extensions on
// relative imports so Deno can load the files unchanged.

export type Chronotype = 'lion' | 'bear' | 'wolf' | 'dolphin';

/** ISO weekday, matching Luxon: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Wall-clock range in a schedule's own zone. `end` may be '24:00'. */
export interface TimeRange {
    start: string; // 'HH:mm'
    end: string; // 'HH:mm'
}

/** Half-open UTC interval in epoch milliseconds: [start, end). */
export interface Interval {
    start: number;
    end: number;
}

export type WeeklyHours = Partial<Record<Weekday, TimeRange[]>>;

export interface DateOverride {
    date: string; // 'yyyy-MM-dd' in the schedule's zone
    ranges: TimeRange[]; // empty = unavailable all day
}

export interface AvailabilitySchedule {
    id: string;
    name: string;
    timezone: string;
    weekly: WeeklyHours;
    overrides: DateOverride[];
}

export interface Participant {
    id: string;
    name: string;
    timezone: string;
    chronotype?: Chronotype;
    /** ISO-3166 alpha-2, used for holidays and regional workweeks. */
    countryCode?: string;
    /** Local working hours, fractional hours (e.g. 9.5 = 09:30). Defaults to 9–17. */
    workingHours?: { start: number; end: number };
    /** Busy time that must not be double-booked. */
    busy?: Interval[];
    /** Optional attendees can be outside comfortable hours without blocking a slot. */
    optional?: boolean;
}

export type LocationKind = 'google_meet' | 'zoom' | 'phone' | 'in_person' | 'custom';

export type EventKind = 'one_on_one' | 'group' | 'round_robin' | 'collective';

export interface IntakeQuestion {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'phone';
    required: boolean;
    options?: string[];
}

export interface EventTypeRules {
    durationMinutes: number;
    /** Step between offered start times. Defaults to the duration. */
    slotIntervalMinutes?: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    minimumNoticeMinutes: number;
    /** Maximum bookings of this event type per day (schedule zone). */
    maxPerDay?: number;
    /** How far ahead invitees can book. */
    rollingWindowDays?: number;
}

export interface EventType extends EventTypeRules {
    id: string;
    ownerId: string;
    slug: string;
    title: string;
    description?: string;
    kind: EventKind;
    location: { kind: LocationKind; value?: string };
    color: string;
    scheduleId: string;
    hostIds: string[];
    /** Seats per slot for group events. */
    seats?: number;
    questions: IntakeQuestion[];
    active: boolean;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled' | 'no_show' | 'completed';

export interface Booking {
    id: string;
    eventTypeId: string;
    hostId: string;
    inviteeName: string;
    inviteeEmail: string;
    inviteeTimezone: string;
    start: string; // ISO UTC
    end: string; // ISO UTC
    status: BookingStatus;
    answers?: Record<string, string>;
    meetingUrl?: string;
    fairnessScore?: number;
    createdAt: string;
}
