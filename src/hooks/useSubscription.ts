import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { RootState } from '../store/store';
import { incrementAiUsage, addBonusCredits } from '../store/slices/subscriptionSlice';
import { SubscriptionTier, SubscriptionPlan } from '../types';

// Feature entitlement map
const FEATURE_TIERS: Record<string, SubscriptionTier[]> = {
    meeting_optimizer: ['pro', 'teams'],
    cultural_calendar: ['pro', 'teams'],
    unlimited_ai: ['pro', 'teams'],
    priority_ai: ['pro', 'teams'],
    export_analytics: ['pro', 'teams'],
    unlimited_team: ['teams'],
    custom_integrations: ['teams'],
    ad_free: ['pro', 'teams'],
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'pro_monthly',
        tier: 'pro',
        period: 'monthly',
        price: 7.99,
        currency: 'USD',
        trialDays: 7,
        features: [
            'Unlimited AI scheduling',
            'Meeting optimizer',
            'Cultural calendar',
            'Energy analytics export',
            'Ad-free experience',
            'Priority AI responses',
        ],
        badge: '🔥',
        popular: true,
    },
    {
        id: 'pro_annual',
        tier: 'pro',
        period: 'annual',
        price: 59.99,
        currency: 'USD',
        trialDays: 7,
        features: [
            'Everything in Pro Monthly',
            'Save 37% ($35.89/year)',
        ],
        badge: '💎',
    },
    {
        id: 'teams_monthly',
        tier: 'teams',
        period: 'monthly',
        price: 14.99,
        currency: 'USD',
        trialDays: 14,
        features: [
            'Everything in Pro',
            'Unlimited team members',
            'Custom calendar integrations',
            'Team analytics dashboard',
            'Admin controls',
        ],
    },
    {
        id: 'teams_annual',
        tier: 'teams',
        period: 'annual',
        price: 119.99,
        currency: 'USD',
        trialDays: 14,
        features: [
            'Everything in Teams Monthly',
            'Save 33% ($59.89/year)',
        ],
    },
];

export function useSubscription() {
    const dispatch = useDispatch();
    const subscription = useSelector((state: RootState) => state.subscription);
    const ads = useSelector((state: RootState) => state.ads);

    const isPro = useMemo(() =>
        subscription.tier === 'pro' || subscription.tier === 'teams',
        [subscription.tier]
    );

    const isTeams = useMemo(() =>
        subscription.tier === 'teams',
        [subscription.tier]
    );

    const isFree = useMemo(() =>
        subscription.tier === 'free',
        [subscription.tier]
    );

    const canAccessFeature = useCallback((feature: string): boolean => {
        const requiredTiers = FEATURE_TIERS[feature];
        if (!requiredTiers) return true; // Feature not gated
        return requiredTiers.includes(subscription.tier);
    }, [subscription.tier]);

    const aiUsageRemaining = useMemo(() =>
        Math.max(0, subscription.aiDailyLimit - subscription.aiUsageToday + ads.rewardedCredits),
        [subscription.aiDailyLimit, subscription.aiUsageToday, ads.rewardedCredits]
    );

    const hasReachedAiLimit = useMemo(() =>
        isFree && aiUsageRemaining <= 0,
        [isFree, aiUsageRemaining]
    );

    const trackAiUsage = useCallback(() => {
        dispatch(incrementAiUsage());
    }, [dispatch]);

    const grantBonusCredits = useCallback((credits: number) => {
        dispatch(addBonusCredits(credits));
    }, [dispatch]);

    return {
        tier: subscription.tier,
        status: subscription.status,
        isActive: subscription.isActive,
        isPro,
        isTeams,
        isFree,
        isTrialActive: subscription.isTrialActive,
        expiresAt: subscription.expiresAt,
        canAccessFeature,
        aiUsageRemaining,
        hasReachedAiLimit,
        aiUsageToday: subscription.aiUsageToday,
        aiDailyLimit: subscription.aiDailyLimit,
        trackAiUsage,
        grantBonusCredits,
        loading: subscription.loading,
        plans: SUBSCRIPTION_PLANS,
    };
}
