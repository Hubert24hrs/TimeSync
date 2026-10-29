import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { FEATURE_LABELS, requiredTier, useSubscription, type Feature } from '../hooks/useSubscription';
import { useAppDispatch, useAppSelector } from '../store/store';
import { incrementAdImpressions, setConsent } from '../store/slices/adsSlice';
import { radius, spacing, useTheme } from '../theme';
import { Button, Card, ListRow, Txt } from '../ui/primitives';

export function UpgradeCard({ feature, compact }: { feature: Feature; compact?: boolean }) {
    const { c } = useTheme();
    const tier = requiredTier(feature) === 'pro' ? 'Pro' : 'Team';
    return (
        <Card accent={c.primary} style={{ gap: spacing.sm, alignItems: compact ? 'stretch' : 'center' }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <Ionicons name="lock-closed" size={18} color={c.primary} />
                <Txt variant="bodyStrong">
                    {FEATURE_LABELS[feature]} is a {tier} feature
                </Txt>
            </View>
            {!compact ? (
                <Txt tone="muted" style={{ textAlign: 'center' }}>
                    Upgrade to unlock it, plus everything else in {tier}.
                </Txt>
            ) : null}
            <Button title={`See ${tier} plans`} icon="sparkles" size="sm" onPress={() => router.push({ pathname: '/paywall', params: { feature } })} />
        </Card>
    );
}

/** Renders children when the plan includes `feature`, otherwise an upgrade prompt (or `fallback`). */
export function FeatureGate({ feature, children, fallback }: { feature: Feature; children: ReactNode; fallback?: ReactNode }) {
    const { can } = useSubscription();
    if (can(feature)) return <>{children}</>;
    return <>{fallback ?? <UpgradeCard feature={feature} />}</>;
}

/** House ad for free users who consented; hidden on paid plans. */
export function AdBanner() {
    const { c } = useTheme();
    const { can } = useSubscription();
    const consent = useAppSelector((s) => s.ads.consentGiven);
    const dispatch = useAppDispatch();
    const visible = !can('ad_free') && consent;
    useEffect(() => {
        if (visible) dispatch(incrementAdImpressions());
    }, [visible, dispatch]);
    if (!visible) return null;
    return (
        <Pressable accessibilityRole="button" accessibilityLabel="Sponsored: upgrade to remove ads" onPress={() => router.push('/paywall')} style={{ marginTop: spacing.lg, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }}>
            <Txt variant="overline" tone="muted">
                Ad
            </Txt>
            <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
                Sponsored · Go Pro for calendar sync, AI and no ads
            </Txt>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
        </Pressable>
    );
}

/** GDPR consent: nothing optional is enabled until the user chooses. */
export function ConsentModal() {
    const { c } = useTheme();
    const dispatch = useAppDispatch();
    const shownAt = useAppSelector((s) => s.ads.consentShownAt);
    const onboarded = useAppSelector((s) => s.auth.isOnboarded);
    const [analytics, setAnalytics] = useState(false);
    const [ads, setAds] = useState(false);
    if (shownAt || !onboarded) return null;
    const save = (a: boolean, p: boolean) => dispatch(setConsent({ analytics: a, personalizedAds: p }));
    return (
        <Modal transparent animationType="fade" visible onRequestClose={() => save(false, false)}>
            <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: spacing.xl }}>
                <View style={{ backgroundColor: c.cardSolid, borderRadius: radius.xl, padding: spacing.xl, maxWidth: 440, width: '100%', alignSelf: 'center', borderWidth: 1, borderColor: c.border }}>
                    <Txt variant="h2" accessibilityRole="header">
                        Your privacy
                    </Txt>
                    <Txt tone="muted" style={{ marginVertical: spacing.sm }}>
                        Choose what we may use. You can change this anytime in Settings.
                    </Txt>
                    <ListRow icon="shield-checkmark-outline" title="Essential" subtitle="Needed for the app to work" value="Always on" />
                    <ListRow icon="analytics-outline" title="Analytics" subtitle="Anonymous usage to improve TimeSync" toggle={analytics} onToggle={setAnalytics} />
                    <ListRow icon="megaphone-outline" title="Personalised ads" subtitle="Free plan only" toggle={ads} onToggle={setAds} last />
                    <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                        <Button title="Save choices" onPress={() => save(analytics, ads)} fullWidth />
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            <Button title="Reject all" variant="secondary" onPress={() => save(false, false)} style={{ flex: 1 }} />
                            <Button title="Accept all" variant="secondary" onPress={() => save(true, true)} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
