import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isOnboarded: boolean;
    token: string | null;
    loading: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isOnboarded: false,
    token: null,
    loading: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        setOnboarded: (state, action: PayloadAction<boolean>) => {
            state.isOnboarded = action.payload;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
        },
    },
});

export const { setUser, setOnboarded, setToken, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
