import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { FEATURE_LABELS, SUBSCRIPTION_PLANS, useSubscription, type Feature } from '../src/hooks/useSubscription';
import { useLayout } from '../src/hooks/useLayout';
import { haptics } from '../src/lib/haptics';
import { setSubscription } from '../src/store/slices/subscriptionSlice';
import { useAppDispatch, useAppSelector } from '../src/store/store';
import { spacing, useTheme } from '../src/theme';
import type { BillingPeriod } from '../src/types';
import { Screen } from '../src/ui/Screen';
import { Badge, Button, Card, Segmented, Txt } from '../src/ui/primitives';

const FREE = ['1 active event type', 'Booking page, QR & embed', 'Fair meeting optimizer', 'Polls & .ics export', 'On-device assistant'];

export default function Paywall() {
    const { c } = useTheme();
    const dispatch = useAppDispatch();
    const { feature } = useLocalSearchParams<{ feature?: Feature }>();
    const mode = useAppSelector((s) => s.auth.mode);
    const { tier } = useSubscription();
    const { isTablet } = useLayout();
    const [period, setPeriod] = useState<BillingPeriod>('monthly');
    const [note, setNote] = useState<string | null>(null);
    const plans = SUBSCRIPTION_PLANS.filter((p) => p.period === period);

    const choose = (t: 'free' | 'pro' | 'teams', trialDays = 0) => {
        if (mode !== 'demo') {
            setNote('In-app purchases are not connected yet in this build. Your plan is managed on the server (profiles.tier).');
            return;
        }
        haptics.success();
        dispatch(setSubscription({ tier: t, status: trialDays ? 'trialing' : 'active', expiresAt: null, trialEndsAt: trialDays ? new Date(Date.now() + trialDays * 86_400_000).toISOString() : null }));
        router.back();
    };

    return (
        <Screen title="Plans" subtitle={feature ? `${FEATURE_LABELS[feature]} needs an upgrade` : 'Scheduling for global teams'} back="close" maxWidth={1000}>
            <Segmented value={period} onChange={setPeriod} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'annual', label: 'Annual · 2 months free' }]} />
            <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: spacing.md, marginTop: spacing.lg }}>
                <Card style={{ flex: 1, gap: spacing.sm }}>
                    <Txt variant="h2">Free</Txt>
                    <Txt variant="clock">$0</Txt>
                    {FREE.map((f) => (
                        <View key={f} style={{ flexDirection: 'row', gap: 6 }}>
                            <Ionicons name="checkmark" size={16} color={c.textMuted} />
                            <Txt variant="caption" tone="secondary">
                                {f}
                            </Txt>
                        </View>
                    ))}
                    {tier === 'free' ? <Badge label="Current plan" /> : <Button title="Downgrade" size="sm" variant="secondary" onPress={() => choose('free')} />}
                </Card>
                {plans.map((p) => (
                    <Card key={p.id} accent={p.tier === 'pro' ? c.primary : c.accent} style={{ flex: 1, gap: spacing.sm, borderColor: p.tier === 'pro' ? c.primary : c.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Txt variant="h2">{p.tier === 'pro' ? 'Pro' : 'Team'}</Txt>
                            {p.tier === 'pro' ? <Badge tone="primary" label="Most popular" /> : <Badge tone="accent" label="per member" />}
                        </View>
                        <Txt variant="clock">
                            ${p.price}
                            <Txt variant="caption" tone="muted">{` /${period === 'monthly' ? 'mo' : 'yr'}`}</Txt>
                        </Txt>
                        {p.features.map((f) => (
                            <View key={f} style={{ flexDirection: 'row', gap: 6 }}>
                                <Ionicons name="checkmark-circle" size={16} color={p.tier === 'pro' ? c.primary : c.accent} />
                                <Txt variant="caption" tone="secondary">
                                    {f}
                                </Txt>
                            </View>
                        ))}
                        {tier === p.tier ? <Badge label="Current plan" /> : <Button title={`Start ${p.trialDays}-day trial`} size="sm" onPress={() => choose(p.tier, p.trialDays)} />}
                    </Card>
                ))}
            </View>
            {note ? (
                <Txt tone="warning" style={{ marginTop: spacing.lg }}>
                    {note}
                </Txt>
            ) : null}
            {mode === 'demo' ? (
                <Txt variant="caption" tone="muted" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
                    Demo mode: choosing a plan simulates the upgrade on this device. No payment is taken.
                </Txt>
            ) : null}
        </Screen>
    );
}
