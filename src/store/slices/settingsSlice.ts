import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../theme';

interface SettingsState {
    theme: ThemeMode;
    language: string;
    notificationsEnabled: boolean;
    biometricsEnabled: boolean;
    calendarIntegrations: { provider: string; connected: boolean }[];
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
    },
});

export const { setTheme, setLanguage, setNotifications, setBiometrics, toggleCalendarIntegration } = settingsSlice.actions;
export default settingsSlice.reducer;
