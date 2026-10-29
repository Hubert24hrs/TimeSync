import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AvailabilitySchedule, Booking, CalendarConnection, EventType, Poll, Profile, RoutingFormRecord, Webhook } from '../../types';

// Local workspace: the whole dataset in demo mode, and the offline cache of the signed-in user's data.

export interface WorkspaceState {
    seeded: boolean;
    me: Profile | null;
    team: Profile[];
    schedules: AvailabilitySchedule[];
    eventTypes: EventType[];
    bookings: Booking[];
    polls: Poll[];
    routingForms: RoutingFormRecord[];
    webhooks: Webhook[];
    calendars: CalendarConnection[];
}

const initialState: WorkspaceState = {
    seeded: false,
    me: null,
    team: [],
    schedules: [],
    eventTypes: [],
    bookings: [],
    polls: [],
    routingForms: [],
    webhooks: [],
    calendars: [],
};

function upsert<T extends { id: string }>(list: T[], item: T): void {
    const i = list.findIndex((x) => x.id === item.id);
    if (i === -1) list.push(item);
    else list[i] = item;
}

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState,
    reducers: {
        seedWorkspace: (_state, action: PayloadAction<Omit<WorkspaceState, 'seeded'>>) => ({ ...action.payload, seeded: true }),
        resetWorkspace: () => initialState,
        updateMe: (state, action: PayloadAction<Partial<Profile>>) => {
            if (state.me) state.me = { ...state.me, ...action.payload };
        },
        saveSchedule: (state, action: PayloadAction<AvailabilitySchedule>) => upsert(state.schedules, action.payload),
        deleteSchedule: (state, action: PayloadAction<string>) => {
            state.schedules = state.schedules.filter((s) => s.id !== action.payload);
        },
        saveEventType: (state, action: PayloadAction<EventType>) => upsert(state.eventTypes, action.payload),
        deleteEventType: (state, action: PayloadAction<string>) => {
            state.eventTypes = state.eventTypes.filter((e) => e.id !== action.payload);
        },
        saveBooking: (state, action: PayloadAction<Booking>) => upsert(state.bookings, action.payload),
        savePoll: (state, action: PayloadAction<Poll>) => upsert(state.polls, action.payload),
        saveWebhook: (state, action: PayloadAction<Webhook>) => upsert(state.webhooks, action.payload),
        deleteWebhook: (state, action: PayloadAction<string>) => {
            state.webhooks = state.webhooks.filter((w) => w.id !== action.payload);
        },
    },
});

export const {
    seedWorkspace,
    resetWorkspace,
    updateMe,
    saveSchedule,
    deleteSchedule,
    saveEventType,
    deleteEventType,
    saveBooking,
    savePoll,
    saveWebhook,
    deleteWebhook,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
