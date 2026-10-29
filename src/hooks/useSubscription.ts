import { useCallback } from 'react';
import { useAppSelector } from '../store/store';
import type { SubscriptionPlan, SubscriptionTier } from '../types';

// Plan entitlements. Free: 1 event type + basic optimizer. Pro: unlimited events, calendar sync,
// AI assistant, chronotype energy ranking, analytics. Team: round-robin, collective, routing, Slack.
export type Feature =
    | 'unlimited_event_types'
    | 'calendar_sync'
    | 'ai_assistant'
    | 'chronotypes'
    | 'analytics'
    | 'cultural_calendar'
    | 'ad_free'
    | 'round_robin'
    | 'routing_forms'
    | 'slack'
    | 'webhooks';

const FEATURE_TIERS: Record<Feature, SubscriptionTier[]> = {
    unlimited_event_types: ['pro', 'teams'],
    calendar_sync: ['pro', 'teams'],
    ai_assistant: ['pro', 'teams'],
    chronotypes: ['pro', 'teams'],
    analytics: ['pro', 'teams'],
    cultural_calendar: ['pro', 'teams'],
    ad_free: ['pro', 'teams'],
    webhooks: ['pro', 'teams'],
    round_robin: ['teams'],
    routing_forms: ['teams'],
    slack: ['teams'],
};

export const FEATURE_LABELS: Record<Feature, string> = {
    unlimited_event_types: 'Unlimited event types',
    calendar_sync: 'Google & Outlook calendar sync',
    ai_assistant: 'AI scheduling assistant',
    chronotypes: 'Chronotype energy ranking',
    analytics: 'Scheduling analytics',
    cultural_calendar: 'Cultural calendar',
    ad_free: 'Ad-free',
    webhooks: 'Webhooks & Zapier',
    round_robin: 'Round-robin & collective events',
    routing_forms: 'Routing forms',
    slack: 'Slack bot',
};

export const requiredTier = (feature: Feature): Exclude<SubscriptionTier, 'free'> => (FEATURE_TIERS[feature].includes('pro') ? 'pro' : 'teams');

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    { id: 'pro_monthly', tier: 'pro', period: 'monthly', price: 8, currency: 'USD', trialDays: 7, popular: true, features: ['Unlimited event types', 'Google & Outlook sync', 'AI assistant', 'Chronotype energy ranking', 'Analytics', 'Ad-free'] },
    { id: 'pro_annual', tier: 'pro', period: 'annual', price: 72, currency: 'USD', trialDays: 7, features: ['Everything in Pro', '2 months free'] },
    { id: 'teams_monthly', tier: 'teams', period: 'monthly', price: 15, currency: 'USD', trialDays: 14, features: ['Everything in Pro', 'Round-robin & collective events', 'Routing forms', 'Slack bot', 'Shared event types'] },
    { id: 'teams_annual', tier: 'teams', period: 'annual', price: 144, currency: 'USD', trialDays: 14, features: ['Everything in Team', '2 months free'] },
];

export function useSubscription() {
    const { tier, status, expiresAt, trialEndsAt } = useAppSelector((s) => s.subscription);
    const can = useCallback((feature: Feature) => FEATURE_TIERS[feature].includes(tier), [tier]);
    return { tier, status, expiresAt, trialEndsAt, isFree: tier === 'free', isPro: tier !== 'free', isTeams: tier === 'teams', can };
}
