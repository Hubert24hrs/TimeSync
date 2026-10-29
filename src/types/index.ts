import type { Booking, Chronotype, EventType, AvailabilitySchedule, RoutingForm, VoteAnswer } from '../engine';

export type { Booking, Chronotype, EventType, AvailabilitySchedule, VoteAnswer };

export type SubscriptionTier = 'free' | 'pro' | 'teams';
export type BillingPeriod = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'cancelled';
export type MemberStatus = 'online' | 'away' | 'offline';

export interface Profile {
    id: string;
    username: string;
    name: string;
    email: string;
    timezone: string;
    chronotype: Chronotype;
    countryCode?: string;
    workingHours: { start: number; end: number };
    role?: string;
    latitude?: number;
    longitude?: number;
    status?: MemberStatus;
}

export interface Poll {
    id: string;
    title: string;
    durationMinutes: number;
    status: 'open' | 'closed' | 'booked';
    participantIds: string[];
    options: { id: string; start: string; end: string }[];
    votes: { voterId: string; optionId: string; answer: VoteAnswer }[];
    winnerOptionId?: string;
    createdAt: string;
}

export interface RoutingFormRecord {
    id: string;
    slug: string;
    title: string;
    questions: { id: string; label: string; options: string[] }[];
    form: RoutingForm;
}

export interface Webhook {
    id: string;
    url: string;
    events: string[];
    active: boolean;
}

export interface CalendarConnection {
    id: string;
    provider: 'google' | 'outlook';
    email: string;
    lastSyncedAt?: string;
}

export interface SubscriptionPlan {
    id: string;
    tier: Exclude<SubscriptionTier, 'free'>;
    period: BillingPeriod;
    price: number;
    currency: string;
    trialDays: number;
    features: string[];
    popular?: boolean;
}

export interface SlotSuggestion {
    start: string;
    end: string;
    fairness: number;
    energy: number;
    pros: string[];
    cons: string[];
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
    suggestions?: SlotSuggestion[];
    quickReplies?: string[];
}
