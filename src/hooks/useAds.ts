import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState } from '../store/store';
import {
    incrementInterstitialCount,
    setLastInterstitial,
    addRewardedCredits,
    incrementAdImpressions,
} from '../store/slices/adsSlice';
import { addBonusCredits } from '../store/slices/subscriptionSlice';

const MIN_INTERSTITIAL_INTERVAL_MS = 60 * 1000; // 60 seconds min between interstitials

export function useAds() {
    const dispatch = useDispatch();
    const ads = useSelector((state: RootState) => state.ads);
    const subscription = useSelector((state: RootState) => state.subscription);

    const shouldShowAds = useMemo(() => {
        if (subscription.tier !== 'free') return false;
        if (!ads.adsEnabled) return false;
        if (!ads.consentGiven) return false;
        return true;
    }, [subscription.tier, ads.adsEnabled, ads.consentGiven]);

    const canShowInterstitial = useMemo(() => {
        if (!shouldShowAds) return false;
        if (ads.interstitialCount < ads.interstitialFrequency - 1) return false;
        if (ads.lastInterstitialAt) {
            const elapsed = Date.now() - new Date(ads.lastInterstitialAt).getTime();
            if (elapsed < MIN_INTERSTITIAL_INTERVAL_MS) return false;
        }
        return true;
    }, [shouldShowAds, ads.interstitialCount, ads.interstitialFrequency, ads.lastInterstitialAt]);

    const onInterstitialShown = useCallback(() => {
        dispatch(incrementInterstitialCount());
        dispatch(setLastInterstitial(new Date().toISOString()));
        dispatch(incrementAdImpressions());
    }, [dispatch]);

    const onRewardedAdCompleted = useCallback((creditAmount: number = 5) => {
        dispatch(addRewardedCredits(creditAmount));
        dispatch(addBonusCredits(creditAmount));
        dispatch(incrementAdImpressions());
    }, [dispatch]);

    const onBannerImpression = useCallback(() => {
        dispatch(incrementAdImpressions());
    }, [dispatch]);

    return {
        shouldShowAds,
        canShowInterstitial,
        consentGiven: ads.consentGiven,
        rewardedCredits: ads.rewardedCredits,
        totalImpressions: ads.totalAdImpressions,
        onInterstitialShown,
        onRewardedAdCompleted,
        onBannerImpression,
    };
}
