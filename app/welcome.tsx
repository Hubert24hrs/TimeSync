import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { DEMO_USER_ID } from '../src/data/demo';
import { signInWithProvider } from '../src/lib/auth';
import { isBackendConfigured } from '../src/lib/config';
import { startDemo, signedIn } from '../src/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../src/store/store';
import { spacing, useTheme } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Txt } from '../src/ui/primitives';

const FEATURES = [
    { icon: 'scale-outline', text: 'Fair meeting times across every time zone' },
    { icon: 'link-outline', text: 'Booking links, polls and round-robin for teams' },
    { icon: 'flash-outline', text: 'Energy-aware scheduling by chronotype' },
] as const;

export default function Welcome() {
    const { c } = useTheme();
    const dispatch = useAppDispatch();
    const mode = useAppSelector((s) => s.auth.mode);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const spin = useSharedValue(0);

    useEffect(() => {
        spin.value = withRepeat(withTiming(1, { duration: 24_000, easing: Easing.linear }), -1);
    }, [spin]);
    useEffect(() => {
        if (mode !== 'none') router.replace('/');
    }, [mode]);
    const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

    const signIn = async (provider: 'google' | 'apple') => {
        setBusy(provider);
        setError(null);
        try {
            const session = await signInWithProvider(provider);
            if (session) dispatch(signedIn(session));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign-in failed');
        } finally {
            setBusy(null);
        }
    };

    return (
        <Screen maxWidth={520} contentStyle={{ paddingTop: spacing.xxxl }}>
            <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
                <Animated.View style={[{ width: 132, height: 132, borderRadius: 66, borderWidth: 2, borderColor: c.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }, ring]}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent, position: 'absolute', top: -5 }} />
                </Animated.View>
                <View style={{ position: 'absolute', top: 36 }}>
                    <Ionicons name="time" size={60} color={c.primary} />
                </View>
                <Animated.View entering={FadeInDown.delay(150)}>
                    <Txt variant="display" style={{ marginTop: spacing.xl, textAlign: 'center' }}>
                        Time<Txt variant="display" tone="primary">Sync</Txt>
                    </Txt>
                    <Txt tone="muted" style={{ textAlign: 'center', marginTop: spacing.sm }}>
                        Scheduling that respects every time zone.
                    </Txt>
                </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(300)} style={{ gap: spacing.md }}>
                {FEATURES.map((f) => (
                    <Card key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
                        <Ionicons name={f.icon} size={20} color={c.accent} />
                        <Txt style={{ flex: 1 }}>{f.text}</Txt>
                    </Card>
                ))}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(450)} style={{ gap: spacing.md, marginTop: spacing.xxl }}>
                {isBackendConfigured ? (
                    <>
                        <Button title="Continue with Google" icon="logo-google" size="lg" fullWidth loading={busy === 'google'} onPress={() => signIn('google')} />
                        {Platform.OS !== 'android' ? <Button title="Continue with Apple" icon="logo-apple" size="lg" variant="secondary" fullWidth loading={busy === 'apple'} onPress={() => signIn('apple')} /> : null}
                    </>
                ) : null}
                <Button
                    title="Explore with demo data"
                    icon="planet-outline"
                    size="lg"
                    variant={isBackendConfigured ? 'ghost' : 'primary'}
                    fullWidth
                    onPress={() => dispatch(startDemo({ userId: DEMO_USER_ID }))}
                />
                {error ? (
                    <Txt tone="danger" style={{ textAlign: 'center' }}>
                        {error}
                    </Txt>
                ) : null}
                {!isBackendConfigured ? (
                    <Txt variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                        No backend configured — everything runs on this device. See README to connect Supabase.
                    </Txt>
                ) : null}
            </Animated.View>
        </Screen>
    );
}
