import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdsState {
    adsEnabled: boolean;
    consentGiven: boolean;
    personalizedAdsConsent: boolean;
    analyticsConsent: boolean;
    interstitialCount: number;
    interstitialFrequency: number;
    lastInterstitialAt: string | null;
    rewardedCredits: number;
    totalAdImpressions: number;
    consentShownAt: string | null;
}

const initialState: AdsState = {
    adsEnabled: true,
    consentGiven: false,
    personalizedAdsConsent: false,
    analyticsConsent: false,
    interstitialCount: 0,
    interstitialFrequency: 3,
    lastInterstitialAt: null,
    rewardedCredits: 0,
    totalAdImpressions: 0,
    consentShownAt: null,
};

const adsSlice = createSlice({
    name: 'ads',
    initialState,
    reducers: {
        setAdsEnabled: (state, action: PayloadAction<boolean>) => {
            state.adsEnabled = action.payload;
        },
        setConsent: (state, action: PayloadAction<{
            given: boolean;
            personalizedAds: boolean;
            analytics: boolean;
        }>) => {
            state.consentGiven = action.payload.given;
            state.personalizedAdsConsent = action.payload.personalizedAds;
            state.analyticsConsent = action.payload.analytics;
            state.consentShownAt = new Date().toISOString();
        },
        incrementInterstitialCount: (state) => {
            state.interstitialCount += 1;
        },
        resetInterstitialCount: (state) => {
            state.interstitialCount = 0;
        },
        setLastInterstitial: (state, action: PayloadAction<string>) => {
            state.lastInterstitialAt = action.payload;
        },
        addRewardedCredits: (state, action: PayloadAction<number>) => {
            state.rewardedCredits += action.payload;
        },
        useRewardedCredit: (state) => {
            if (state.rewardedCredits > 0) state.rewardedCredits -= 1;
        },
        incrementAdImpressions: (state) => {
            state.totalAdImpressions += 1;
        },
    },
});

export const {
    setAdsEnabled,
    setConsent,
    incrementInterstitialCount,
    resetInterstitialCount,
    setLastInterstitial,
    addRewardedCredits,
    useRewardedCredit,
    incrementAdImpressions,
} = adsSlice.actions;
export default adsSlice.reducer;
