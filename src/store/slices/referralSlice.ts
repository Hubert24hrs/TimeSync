import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ReferralState {
    code: string | null;
    totalReferrals: number;
    pendingRewards: number;
    claimedRewards: number;
}

const initialState: ReferralState = { code: null, totalReferrals: 0, pendingRewards: 0, claimedRewards: 0 };

const referralSlice = createSlice({
    name: 'referral',
    initialState,
    reducers: {
        setReferralCode: (state, action: PayloadAction<string>) => {
            state.code = action.payload;
        },
        claimReward: (state) => {
            if (state.pendingRewards > 0) {
                state.pendingRewards -= 1;
                state.claimedRewards += 1;
            }
        },
    },
});

export const { setReferralCode, claimReward } = referralSlice.actions;
export default referralSlice.reducer;
