import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CalendarEvent, ViewMode } from '../../types';

interface CalendarState {
    events: CalendarEvent[];
    selectedDate: string;
    viewMode: ViewMode;
    loading: boolean;
}

const initialState: CalendarState = {
    events: [],
    selectedDate: new Date().toISOString().split('T')[0],
    viewMode: 'month',
    loading: false,
};

const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setEvents: (state, action: PayloadAction<CalendarEvent[]>) => {
            state.events = action.payload;
        },
        addEvent: (state, action: PayloadAction<CalendarEvent>) => {
            state.events.push(action.payload);
        },
        updateEvent: (state, action: PayloadAction<CalendarEvent>) => {
            const idx = state.events.findIndex((e) => e.id === action.payload.id);
            if (idx !== -1) state.events[idx] = action.payload;
        },
        removeEvent: (state, action: PayloadAction<string>) => {
            state.events = state.events.filter((e) => e.id !== action.payload);
        },
        setSelectedDate: (state, action: PayloadAction<string>) => {
            state.selectedDate = action.payload;
        },
        setViewMode: (state, action: PayloadAction<ViewMode>) => {
            state.viewMode = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setEvents, addEvent, updateEvent, removeEvent, setSelectedDate, setViewMode, setLoading } = calendarSlice.actions;
export default calendarSlice.reducer;
