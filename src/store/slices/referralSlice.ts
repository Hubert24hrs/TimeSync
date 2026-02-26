import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ReferralState {
    code: string | null;
    totalReferrals: number;
    pendingRewards: number;
    claimedRewards: number;
    referralHistory: { email: string; date: string; status: 'pending' | 'completed' }[];
}

const initialState: ReferralState = {
    code: null,
    totalReferrals: 0,
    pendingRewards: 0,
    claimedRewards: 0,
    referralHistory: [],
};

const referralSlice = createSlice({
    name: 'referral',
    initialState,
    reducers: {
        setReferralCode: (state, action: PayloadAction<string>) => {
            state.code = action.payload;
        },
        addReferral: (state, action: PayloadAction<{ email: string; date: string }>) => {
            state.totalReferrals += 1;
            state.pendingRewards += 1;
            state.referralHistory.push({
                email: action.payload.email,
                date: action.payload.date,
                status: 'pending',
            });
        },
        claimReward: (state) => {
            if (state.pendingRewards > 0) {
                state.pendingRewards -= 1;
                state.claimedRewards += 1;
            }
        },
        setReferralHistory: (state, action: PayloadAction<ReferralState['referralHistory']>) => {
            state.referralHistory = action.payload;
        },
    },
});

export const { setReferralCode, addReferral, claimReward, setReferralHistory } = referralSlice.actions;
export default referralSlice.reducer;
