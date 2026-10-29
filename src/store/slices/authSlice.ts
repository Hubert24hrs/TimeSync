import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 'demo' runs entirely on-device with the demo workspace; 'cloud' is a signed-in Supabase session.
export type AuthMode = 'none' | 'demo' | 'cloud';

interface AuthState {
    mode: AuthMode;
    userId: string | null;
    email: string | null;
    isOnboarded: boolean;
}

const initialState: AuthState = { mode: 'none', userId: null, email: null, isOnboarded: false };

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        startDemo: (state, action: PayloadAction<{ userId: string }>) => {
            state.mode = 'demo';
            state.userId = action.payload.userId;
            state.email = null;
        },
        signedIn: (state, action: PayloadAction<{ userId: string; email: string | null }>) => {
            state.mode = 'cloud';
            state.userId = action.payload.userId;
            state.email = action.payload.email;
        },
        setOnboarded: (state, action: PayloadAction<boolean>) => {
            state.isOnboarded = action.payload;
        },
        logout: () => initialState,
    },
});

export const { startDemo, signedIn, setOnboarded, logout } = authSlice.actions;
export default authSlice.reducer;
