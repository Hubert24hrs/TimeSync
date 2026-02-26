import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../theme';

interface SettingsState {
    theme: ThemeMode;
    language: string;
    notificationsEnabled: boolean;
    biometricsEnabled: boolean;
    calendarIntegrations: { provider: string; connected: boolean }[];
    // Security
    appLockEnabled: boolean;
    autoLockTimeout: number; // minutes: 0 = never, 1, 5, 15
    pinCodeHash: string | null;
}

const initialState: SettingsState = {
    theme: 'dark',
    language: 'en',
    notificationsEnabled: true,
    biometricsEnabled: false,
    calendarIntegrations: [
        { provider: 'Google Calendar', connected: false },
        { provider: 'Outlook', connected: false },
        { provider: 'Apple Calendar', connected: false },
    ],
    appLockEnabled: false,
    autoLockTimeout: 5,
    pinCodeHash: null,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeMode>) => {
            state.theme = action.payload;
        },
        setLanguage: (state, action: PayloadAction<string>) => {
            state.language = action.payload;
        },
        setNotifications: (state, action: PayloadAction<boolean>) => {
            state.notificationsEnabled = action.payload;
        },
        setBiometrics: (state, action: PayloadAction<boolean>) => {
            state.biometricsEnabled = action.payload;
        },
        toggleCalendarIntegration: (state, action: PayloadAction<string>) => {
            const integration = state.calendarIntegrations.find((i) => i.provider === action.payload);
            if (integration) integration.connected = !integration.connected;
        },
        setAppLockEnabled: (state, action: PayloadAction<boolean>) => {
            state.appLockEnabled = action.payload;
        },
        setAutoLockTimeout: (state, action: PayloadAction<number>) => {
            state.autoLockTimeout = action.payload;
        },
        setPinCodeHash: (state, action: PayloadAction<string | null>) => {
            state.pinCodeHash = action.payload;
        },
    },
});

export const {
    setTheme,
    setLanguage,
    setNotifications,
    setBiometrics,
    toggleCalendarIntegration,
    setAppLockEnabled,
    setAutoLockTimeout,
    setPinCodeHash,
} = settingsSlice.actions;
export default settingsSlice.reducer;
