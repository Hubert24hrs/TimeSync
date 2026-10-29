import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeSetting = 'dark' | 'light' | 'auto';

interface SettingsState {
    theme: ThemeSetting;
    hour12: boolean;
    notificationsEnabled: boolean;
    hapticsEnabled: boolean;
}

const initialState: SettingsState = {
    theme: 'dark',
    hour12: true,
    notificationsEnabled: true,
    hapticsEnabled: true,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeSetting>) => {
            state.theme = action.payload;
        },
        setHour12: (state, action: PayloadAction<boolean>) => {
            state.hour12 = action.payload;
        },
        setNotifications: (state, action: PayloadAction<boolean>) => {
            state.notificationsEnabled = action.payload;
        },
        setHaptics: (state, action: PayloadAction<boolean>) => {
            state.hapticsEnabled = action.payload;
        },
    },
});

export const { setTheme, setHour12, setNotifications, setHaptics } = settingsSlice.actions;
export default settingsSlice.reducer;
