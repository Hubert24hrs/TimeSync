import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const ANALYTICS_EVENTS = {
    // Subscription
    PAYWALL_VIEWED: 'paywall_viewed',
    TRIAL_STARTED: 'trial_started',
    SUBSCRIPTION_PURCHASED: 'subscription_purchased',
    SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
    SUBSCRIPTION_RESTORED: 'subscription_restored',

    // Ads
    AD_IMPRESSION: 'ad_impression',
    AD_CLICKED: 'ad_clicked',
    REWARDED_AD_COMPLETED: 'rewarded_ad_completed',
    REWARDED_AD_SKIPPED: 'rewarded_ad_skipped',

    // Feature usage
    AI_CHAT_SENT: 'ai_chat_sent',
    AI_LIMIT_HIT: 'ai_limit_hit',
    FEATURE_GATE_HIT: 'feature_gate_hit',
    MEETING_OPTIMIZED: 'meeting_optimized',

    // Referrals
    REFERRAL_SHARED: 'referral_shared',
    REFERRAL_REDEEMED: 'referral_redeemed',
    REFERRAL_REWARD_CLAIMED: 'referral_reward_claimed',

    // Navigation
    SCREEN_VIEWED: 'screen_viewed',
    TAB_SWITCHED: 'tab_switched',
} as const;

export function useAnalytics() {
    const subscription = useSelector((state: RootState) => state.subscription);
    const ads = useSelector((state: RootState) => state.ads);

    const trackEvent = useCallback((
        eventName: string,
        params: Record<string, string | number | boolean> = {}
    ) => {
        const enrichedParams = {
            ...params,
            subscription_tier: subscription.tier,
            is_premium: subscription.tier !== 'free',
            timestamp: new Date().toISOString(),
        };

        // In production, this would call Firebase/Mixpanel SDK
        if (__DEV__) {
            console.log(`📊 [Analytics] ${eventName}`, enrichedParams);
        }

        // TODO: Replace with actual SDK calls:
        // firebase.analytics().logEvent(eventName, enrichedParams);
        // mixpanel.track(eventName, enrichedParams);
    }, [subscription.tier]);

    const trackRevenue = useCallback((
        productId: string,
        amount: number,
        currency: string = 'USD'
    ) => {
        const params = {
            product_id: productId,
            amount,
            currency,
            subscription_tier: subscription.tier,
        };

        if (__DEV__) {
            console.log(`💰 [Revenue] ${productId}: $${amount}`, params);
        }

        // TODO: firebase.analytics().logEvent('purchase', params);
    }, [subscription.tier]);

    const trackScreen = useCallback((screenName: string) => {
        trackEvent(ANALYTICS_EVENTS.SCREEN_VIEWED, { screen: screenName });
    }, [trackEvent]);

    const setUserProperty = useCallback((key: string, value: string) => {
        if (__DEV__) {
            console.log(`👤 [UserProperty] ${key}: ${value}`);
        }
        // TODO: firebase.analytics().setUserProperty(key, value);
    }, []);

    return {
        trackEvent,
        trackRevenue,
        trackScreen,
        setUserProperty,
        EVENTS: ANALYTICS_EVENTS,
    };
}
