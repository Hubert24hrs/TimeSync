import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AdsState {
    consentGiven: boolean;
    personalizedAdsConsent: boolean;
    analyticsConsent: boolean;
    consentShownAt: string | null;
    totalAdImpressions: number;
}

const initialState: AdsState = { consentGiven: false, personalizedAdsConsent: false, analyticsConsent: false, consentShownAt: null, totalAdImpressions: 0 };

const adsSlice = createSlice({
    name: 'ads',
    initialState,
    reducers: {
        setConsent: (state, action: PayloadAction<{ personalizedAds: boolean; analytics: boolean }>) => {
            state.consentGiven = true;
            state.personalizedAdsConsent = action.payload.personalizedAds;
            state.analyticsConsent = action.payload.analytics;
            state.consentShownAt = new Date().toISOString();
        },
        incrementAdImpressions: (state) => {
            state.totalAdImpressions += 1;
        },
    },
});

export const { setConsent, incrementAdImpressions } = adsSlice.actions;
export default adsSlice.reducer;
