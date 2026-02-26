import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionTier, SubscriptionStatus } from '../../types';

interface SubscriptionState {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    isActive: boolean;
    expiresAt: string | null;
    trialEndsAt: string | null;
    isTrialActive: boolean;
    aiUsageToday: number;
    aiDailyLimit: number;
    entitlements: string[];
    loading: boolean;
    lastVerifiedAt: string | null;
}

const initialState: SubscriptionState = {
    tier: 'free',
    status: 'active',
    isActive: false,
    expiresAt: null,
    trialEndsAt: null,
    isTrialActive: false,
    aiUsageToday: 0,
    aiDailyLimit: 5, // Free tier: 5 AI chats/day
    entitlements: [],
    loading: false,
    lastVerifiedAt: null,
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        setSubscription: (state, action: PayloadAction<{
            tier: SubscriptionTier;
            status: SubscriptionStatus;
            expiresAt: string | null;
            trialEndsAt: string | null;
        }>) => {
            state.tier = action.payload.tier;
            state.status = action.payload.status;
            state.expiresAt = action.payload.expiresAt;
            state.trialEndsAt = action.payload.trialEndsAt;
            state.isActive = action.payload.status === 'active' || action.payload.status === 'trialing';
            state.isTrialActive = action.payload.status === 'trialing';
            state.aiDailyLimit = action.payload.tier === 'free' ? 5 : 999;
        },
        setTier: (state, action: PayloadAction<SubscriptionTier>) => {
            state.tier = action.payload;
            state.aiDailyLimit = action.payload === 'free' ? 5 : 999;
        },
        incrementAiUsage: (state) => {
            state.aiUsageToday += 1;
        },
        resetDailyUsage: (state) => {
            state.aiUsageToday = 0;
        },
        setEntitlements: (state, action: PayloadAction<string[]>) => {
            state.entitlements = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setLastVerified: (state, action: PayloadAction<string>) => {
            state.lastVerifiedAt = action.payload;
        },
        addBonusCredits: (state, action: PayloadAction<number>) => {
            state.aiDailyLimit += action.payload;
        },
    },
});

export const {
    setSubscription,
    setTier,
    incrementAiUsage,
    resetDailyUsage,
    setEntitlements,
    setLoading,
    setLastVerified,
    addBonusCredits,
} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
