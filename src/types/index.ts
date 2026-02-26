export type Chronotype = 'lion' | 'bear' | 'wolf' | 'dolphin';
export type MeetingStatus = 'confirmed' | 'tentative' | 'cancelled' | 'pending';
export type MemberStatus = 'online' | 'offline' | 'busy' | 'away';
export type EnergySource = 'manual' | 'predicted' | 'wearable';
export type ViewMode = 'day' | 'week' | 'month';

export interface User {
    id: string;
    name: string;
    email: string;
    timezone: string;
    chronotype: Chronotype;
    avatar?: string;
    energyProfile?: number[];
    preferences?: UserPreferences;
}

export interface UserPreferences {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    notificationsEnabled: boolean;
    biometricsEnabled: boolean;
    focusTimeEnabled: boolean;
    culturalCalendars: string[];
}

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    attendees: Attendee[];
    energyCost: number;
    status: MeetingStatus;
    location?: string;
    meetingLink?: string;
    color?: string;
    isRecurring?: boolean;
}

export interface Attendee {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'accepted' | 'declined' | 'pending';
}

export interface TeamMember extends User {
    status: MemberStatus;
    localTime: string;
    role: string;
    latitude?: number;
    longitude?: number;
}

export interface EnergyLevel {
    timestamp: string;
    level: number;
    context?: string;
    source: EnergySource;
}

export interface EnergyForecast {
    date: string;
    hourly: { hour: number; level: number }[];
    peakHours: number[];
    lowHours: number[];
    averageLevel: number;
}

export interface CulturalHoliday {
    id: string;
    name: string;
    date: string;
    religion?: string;
    country: string;
    description: string;
    observanceLevel: 'major' | 'minor' | 'optional';
    emoji?: string;
}

export interface ScheduleSuggestion {
    id: string;
    startTime: string;
    endTime: string;
    fairnessScore: number;
    energyScore: number;
    timezone: string;
    pros: string[];
    cons: string[];
    confidence: number;
}

export interface ChronotypeResult {
    type: Chronotype;
    confidence: number;
    peakHours: number[];
    description: string;
    emoji: string;
    color: string;
}

export interface MeetingConflict {
    id: string;
    event1: CalendarEvent;
    event2: CalendarEvent;
    severity: 'hard' | 'soft';
    suggestion?: ScheduleSuggestion;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: string;
    suggestions?: ScheduleSuggestion[];
    quickReplies?: string[];
}

export interface NotificationItem {
    id: string;
    type: 'meeting' | 'conflict' | 'energy' | 'cultural' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

export interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon: string;
    gradient: readonly [string, string];
}
