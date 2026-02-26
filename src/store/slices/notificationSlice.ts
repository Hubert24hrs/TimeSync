import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
    id: string;
    type: 'meeting' | 'energy' | 'team' | 'tip';
    title: string;
    message: string;
    emoji: string;
    time: string;
    read: boolean;
    actionLabel?: string;
}

interface NotificationState {
    items: Notification[];
    unreadCount: number;
    focusModeActive: boolean;
    focusEndTime: string | null;
    doNotDisturb: boolean;
}

const initialState: NotificationState = {
    items: [
        {
            id: '1',
            type: 'energy',
            title: 'Peak Energy',
            message: 'Your energy is at its peak right now — great time for creative work!',
            emoji: '⚡',
            time: '2 min ago',
            read: false,
            actionLabel: 'Start Focus',
        },
        {
            id: '2',
            type: 'meeting',
            title: 'Meeting in 15 min',
            message: 'Team standup starts at 5:30 PM. Your energy level is high!',
            emoji: '📅',
            time: '5 min ago',
            read: false,
        },
        {
            id: '3',
            type: 'team',
            title: 'Team Update',
            message: 'Yuki Tanaka (Tokyo) just started their work day.',
            emoji: '🌏',
            time: '12 min ago',
            read: false,
        },
        {
            id: '4',
            type: 'tip',
            title: 'Schedule Tip',
            message: 'You have a 2-hour gap at 3 PM — consider scheduling deep work.',
            emoji: '💡',
            time: '30 min ago',
            read: true,
        },
    ],
    unreadCount: 3,
    focusModeActive: false,
    focusEndTime: null,
    doNotDisturb: false,
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'read'>>) => {
            state.items.unshift({
                ...action.payload,
                id: Date.now().toString(),
                read: false,
            });
            state.unreadCount++;
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            const item = state.items.find((n) => n.id === action.payload);
            if (item && !item.read) {
                item.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllRead: (state) => {
            state.items.forEach((n) => (n.read = true));
            state.unreadCount = 0;
        },
        dismissNotification: (state, action: PayloadAction<string>) => {
            const idx = state.items.findIndex((n) => n.id === action.payload);
            if (idx !== -1) {
                if (!state.items[idx].read) state.unreadCount--;
                state.items.splice(idx, 1);
            }
        },
        startFocusMode: (state, action: PayloadAction<string>) => {
            state.focusModeActive = true;
            state.focusEndTime = action.payload;
        },
        endFocusMode: (state) => {
            state.focusModeActive = false;
            state.focusEndTime = null;
        },
        toggleDoNotDisturb: (state) => {
            state.doNotDisturb = !state.doNotDisturb;
        },
    },
});

export const {
    addNotification,
    markAsRead,
    markAllRead,
    dismissNotification,
    startFocusMode,
    endFocusMode,
    toggleDoNotDisturb,
} = notificationSlice.actions;

export default notificationSlice.reducer;
