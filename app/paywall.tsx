import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { setSubscription } from '../src/store/slices/subscriptionSlice';
import { setAdsEnabled } from '../src/store/slices/adsSlice';
import { useSubscription, SUBSCRIPTION_PLANS } from '../src/hooks/useSubscription';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { GradientBackground } from '../src/components/atoms/GradientBackground';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { SubscriptionTier, BillingPeriod } from '../src/types';

const { width } = Dimensions.get('window');

export default function PaywallScreen() {
    const dispatch = useDispatch();
    const { tier, isPro } = useSubscription();
    const { trackEvent, trackRevenue, EVENTS } = useAnalytics();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');

    const filteredPlans = SUBSCRIPTION_PLANS.filter(p =>
        p.period === billingPeriod && (p.tier === 'pro' || p.tier === 'teams')
    );

    const handlePurchase = (planId: string, planTier: SubscriptionTier) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        if (!plan) return;

        // Mock purchase - in production, use RevenueCat SDK
        dispatch(setSubscription({
            tier: planTier,
            status: 'trialing',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            trialEndsAt: new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000).toISOString(),
        }));
        dispatch(setAdsEnabled(false));

        trackEvent(EVENTS.TRIAL_STARTED, { plan_id: planId, tier: planTier });
        trackRevenue(planId, plan.price);

        router.back();
    };

    const handleRestore = () => {
        trackEvent(EVENTS.SUBSCRIPTION_RESTORED, {});
        // In production: RevenueCat.restorePurchases()
    };

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <Text style={styles.closeButton}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Hero */}
                    <View style={styles.hero}>
                        <Text style={styles.heroEmoji}>⚡</Text>
                        <Text style={styles.heroTitle}>Unlock TimeSync Pro</Text>
                        <Text style={styles.heroSubtitle}>
                            AI-powered scheduling, energy insights, and meeting optimization
                        </Text>
                    </View>

                    {/* Billing toggle */}
                    <View style={styles.billingToggle}>
                        <Pressable
                            onPress={() => setBillingPeriod('monthly')}
                            style={[styles.toggleOption, billingPeriod === 'monthly' && styles.toggleActive]}
                        >
                            <Text style={[styles.toggleText, billingPeriod === 'monthly' && styles.toggleTextActive]}>
                                Monthly
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setBillingPeriod('annual')}
                            style={[styles.toggleOption, billingPeriod === 'annual' && styles.toggleActive]}
                        >
                            <Text style={[styles.toggleText, billingPeriod === 'annual' && styles.toggleTextActive]}>
                                Annual
                            </Text>
                            <View style={styles.saveBadge}>
                                <Text style={styles.saveBadgeText}>Save 37%</Text>
                            </View>
                        </Pressable>
                    </View>

                    {/* Plan cards */}
                    {filteredPlans.map((plan) => {
                        const isSelected = selectedTier === plan.tier;
                        return (
                            <Pressable key={plan.id} onPress={() => setSelectedTier(plan.tier)}>
                                <LinearGradient
                                    colors={isSelected
                                        ? [colors.primary.main + '25', colors.primary.dark + '15'] as [string, string]
                                        : [colors.dark.card, colors.dark.elevated] as [string, string]}
                                    style={[styles.planCard, isSelected && styles.planCardSelected]}
                                >
                                    <View style={styles.planHeader}>
                                        <View>
                                            <View style={styles.planTitleRow}>
                                                <Text style={styles.planName}>
                                                    {plan.tier === 'pro' ? '🔥 Pro' : '🏢 Teams'}
                                                </Text>
                                                {plan.popular && (
                                                    <View style={styles.popularBadge}>
                                                        <Text style={styles.popularText}>POPULAR</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.planPrice}>
                                                ${plan.price}
                                                <Text style={styles.planPeriod}>
                                                    /{plan.period === 'annual' ? 'year' : 'month'}
                                                </Text>
                                            </Text>
                                        </View>
                                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </View>

                                    {plan.trialDays > 0 && (
                                        <Text style={styles.trialText}>
                                            {plan.trialDays}-day free trial included
                                        </Text>
                                    )}

                                    <View style={styles.featureList}>
                                        {plan.features.map((feature, i) => (
                                            <View key={i} style={styles.featureRow}>
                                                <Text style={styles.featureCheck}>✓</Text>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </LinearGradient>
                            </Pressable>
                        );
                    })}

                    {/* CTA */}
                    <Pressable onPress={() => {
                        const plan = filteredPlans.find(p => p.tier === selectedTier);
                        if (plan) handlePurchase(plan.id, plan.tier);
                    }}>
                        <LinearGradient
                            colors={[colors.primary.main, colors.secondary.main] as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaButton}
                        >
                            <Text style={styles.ctaText}>
                                Start Free Trial →
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Social proof */}
                    <Text style={styles.socialProof}>
                        ⭐ Trusted by 10,000+ teams worldwide
                    </Text>

                    {/* Restore */}
                    <Pressable onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={styles.restoreText}>Restore Purchases</Text>
                    </Pressable>

                    {/* Legal */}
                    <Text style={styles.legal}>
                        Payment will be charged to your App Store account. Subscription automatically
                        renews unless turned off at least 24 hours before the end of the current period.
                    </Text>

                    <View style={{ height: spacing.huge }} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { alignItems: 'flex-end', marginBottom: spacing.md },
    closeButton: { fontSize: 24, color: colors.glass.textMuted, padding: spacing.sm },
    hero: { alignItems: 'center', marginBottom: spacing.xxl },
    heroEmoji: { fontSize: 64, marginBottom: spacing.md },
    heroTitle: { fontFamily: fontFamilies.displayBold, fontSize: 32, color: '#FFF', textAlign: 'center', marginBottom: spacing.sm },
    heroSubtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.lg, color: colors.glass.textMuted, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
    billingToggle: { flexDirection: 'row', backgroundColor: colors.dark.surface, borderRadius: borderRadius.lg, padding: 4, marginBottom: spacing.xl },
    toggleOption: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
    toggleActive: { backgroundColor: colors.dark.card },
    toggleText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.md, color: colors.glass.textMuted },
    toggleTextActive: { color: '#FFF' },
    saveBadge: { backgroundColor: colors.status.success + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    saveBadgeText: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.xs, color: colors.status.success },
    planCard: { borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.md, borderWidth: 1.5, borderColor: colors.glass.border },
    planCardSelected: { borderColor: colors.primary.main },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    planName: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    popularBadge: { backgroundColor: colors.primary.main, paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.pill },
    popularText: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.xs, color: '#FFF', letterSpacing: 1 },
    planPrice: { fontFamily: fontFamilies.displayBold, fontSize: 28, color: '#FFF' },
    planPeriod: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted },
    radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.glass.border, alignItems: 'center', justifyContent: 'center' },
    radioOuterActive: { borderColor: colors.primary.main },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary.main },
    trialText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.status.success, marginBottom: spacing.md },
    featureList: { gap: spacing.sm },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureCheck: { color: colors.primary.light, fontSize: 16 },
    featureText: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: 'rgba(255,255,255,0.85)' },
    ctaButton: { borderRadius: borderRadius.pill, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
    ctaText: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.xl, color: '#FFF' },
    socialProof: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.md, color: colors.glass.textMuted, textAlign: 'center', marginTop: spacing.xl },
    restoreButton: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
    restoreText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.md, color: colors.primary.light },
    legal: { fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, color: colors.glass.textMuted, textAlign: 'center', lineHeight: 16, marginTop: spacing.lg, paddingHorizontal: spacing.md, opacity: 0.7 },
});
