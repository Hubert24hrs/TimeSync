import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SubscriptionStatus, SubscriptionTier } from '../../types';

interface SubscriptionState {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    expiresAt: string | null;
    trialEndsAt: string | null;
}

const initialState: SubscriptionState = { tier: 'free', status: 'active', expiresAt: null, trialEndsAt: null };

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        setSubscription: (_state, action: PayloadAction<SubscriptionState>) => action.payload,
    },
});

export const { setSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
