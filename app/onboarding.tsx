import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { EnergyCurve } from '../src/components/Energy';
import { ZonePicker } from '../src/components/ZonePicker';
import { newId, saveEventType, seedDemoWorkspace, updateProfile } from '../src/data/api';
import { demoEventTypes } from '../src/data/demo';
import { detectTimeZone, formatPeakWindows, workweekLabel } from '../src/engine';
import { bookingUrl } from '../src/lib/config';
import { haptics } from '../src/lib/haptics';
import { setOnboarded } from '../src/store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../src/store/store';
import { chronotypeColors, radius, spacing, useTheme } from '../src/theme';
import type { Chronotype } from '../src/types';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Chip, Field, PressScale, Skeleton, Txt } from '../src/ui/primitives';

const CHRONOTYPES: { type: Chronotype; emoji: string; title: string; body: string }[] = [
    { type: 'lion', emoji: '🦁', title: 'Lion · early bird', body: 'Up before the alarm, sharpest in the morning.' },
    { type: 'bear', emoji: '🐻', title: 'Bear · follows the sun', body: 'Steady energy, peaks late morning.' },
    { type: 'wolf', emoji: '🐺', title: 'Wolf · night owl', body: 'Slow mornings, best work in the evening.' },
    { type: 'dolphin', emoji: '🐬', title: 'Dolphin · light sleeper', body: 'Irregular energy, short intense bursts.' },
];
const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'IN', 'NG', 'BR', 'JP', 'AU', 'SA', 'AE', 'IL', 'CA', 'MX', 'SG'];
const HOURS = [7, 8, 9, 10];
const DURATIONS = [15, 30, 45, 60];

export default function Onboarding() {
    const { c } = useTheme();
    const dispatch = useAppDispatch();
    const mode = useAppSelector((s) => s.auth.mode);
    const seeded = useAppSelector((s) => s.workspace.seeded);
    const me = useAppSelector((s) => s.workspace.me);
    const eventTypes = useAppSelector((s) => s.workspace.eventTypes);
    const [step, setStep] = useState(0);
    const [zone, setZone] = useState(detectTimeZone());
    const [country, setCountry] = useState('US');
    const [startHour, setStartHour] = useState(9);
    const [chronotype, setChronotype] = useState<Chronotype>('bear');
    const [username, setUsername] = useState('');
    const [title, setTitle] = useState('Intro call');
    const [duration, setDuration] = useState(30);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (mode === 'none') router.replace('/welcome');
        if (mode === 'demo' && !seeded) seedDemoWorkspace(zone);
    }, [mode, seeded, zone]);
    useEffect(() => {
        if (me) {
            setUsername((u) => u || me.username);
            setChronotype(me.chronotype);
            if (me.countryCode) setCountry(me.countryCode);
        }
    }, [me]);

    if (!seeded || !me) {
        return (
            <Screen>
                <View style={{ gap: spacing.md, marginTop: spacing.huge }}>
                    <Skeleton height={32} width="60%" />
                    <Skeleton height={120} />
                    <Skeleton height={120} />
                </View>
            </Screen>
        );
    }

    const finish = async () => {
        setSaving(true);
        setError(null);
        try {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meeting';
            await updateProfile({ timezone: zone, countryCode: country, chronotype, username: username.toLowerCase(), workingHours: { start: startHour, end: startHour + 8 } });
            const existing = eventTypes.find((e) => e.ownerId === me.id && e.kind === 'one_on_one');
            const base = existing ?? { ...demoEventTypes[0], id: newId(), ownerId: me.id, hostIds: [me.id], scheduleId: '' };
            await saveEventType({ ...base, title, slug, durationMinutes: duration, active: true });
            dispatch(setOnboarded(true));
            haptics.success();
            router.replace('/(tabs)');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    const next = () => {
        haptics.tap();
        if (step < 2) setStep(step + 1);
        else finish();
    };

    return (
        <Screen maxWidth={620}>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.xl }} accessibilityLabel={`Step ${step + 1} of 3`}>
                {[0, 1, 2].map((i) => (
                    <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.primary : c.border }} />
                ))}
            </View>

            <Animated.View key={step} entering={SlideInRight.duration(280)} exiting={FadeOut.duration(120)} style={{ gap: spacing.lg }}>
                {step === 0 ? (
                    <>
                        <Txt variant="h1">Where do you work from?</Txt>
                        <Txt tone="muted">We detected your time zone. Your teammates and invitees will always see times in their own zone.</Txt>
                        <ZonePicker value={zone} onChange={setZone} />
                        <Txt variant="label" tone="secondary">
                            Country (holidays & workweek)
                        </Txt>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                            {COUNTRIES.map((cc) => (
                                <Chip key={cc} label={cc} selected={country === cc} onPress={() => setCountry(cc)} />
                            ))}
                        </View>
                        <Txt variant="caption" tone="muted">
                            Workweek: {workweekLabel(country)}
                        </Txt>
                        <Txt variant="label" tone="secondary">
                            Working day starts
                        </Txt>
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            {HOURS.map((h) => (
                                <Chip key={h} label={`${h}:00–${h + 8}:00`} selected={startHour === h} onPress={() => setStartHour(h)} />
                            ))}
                        </View>
                    </>
                ) : step === 1 ? (
                    <>
                        <Txt variant="h1">When are you sharpest?</Txt>
                        <Txt tone="muted">Your chronotype lets TimeSync rank meeting times by team energy, not just availability.</Txt>
                        {CHRONOTYPES.map((ct) => (
                            <PressScale key={ct.type} onPress={() => setChronotype(ct.type)} accessibilityRole="radio" accessibilityLabel={ct.title}>
                                <Card accent={chronotype === ct.type ? chronotypeColors[ct.type] : undefined} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderColor: chronotype === ct.type ? chronotypeColors[ct.type] : c.border }}>
                                    <Txt style={{ fontSize: 34 }}>{ct.emoji}</Txt>
                                    <View style={{ flex: 1 }}>
                                        <Txt variant="bodyStrong">{ct.title}</Txt>
                                        <Txt variant="caption" tone="muted">
                                            {ct.body} Peak {formatPeakWindows(ct.type)}.
                                        </Txt>
                                    </View>
                                    {chronotype === ct.type ? <Ionicons name="checkmark-circle" size={22} color={chronotypeColors[ct.type]} /> : null}
                                </Card>
                            </PressScale>
                        ))}
                        <Card style={{ alignItems: 'center' }}>
                            <EnergyCurve chronotype={chronotype} hour={12} width={300} height={70} />
                        </Card>
                    </>
                ) : (
                    <>
                        <Txt variant="h1">Your booking link</Txt>
                        <Txt tone="muted">Share it and invitees pick a time in their own zone — no account needed.</Txt>
                        <Field label="Username" value={username} onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))} autoCapitalize="none" maxLength={40} />
                        <Field label="First event" value={title} onChangeText={setTitle} maxLength={120} />
                        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                            {DURATIONS.map((d) => (
                                <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
                            ))}
                        </View>
                        <Animated.View entering={FadeIn}>
                            <Card accent={c.accent} style={{ gap: 4, borderRadius: radius.lg }}>
                                <Txt variant="caption" tone="muted">
                                    Preview
                                </Txt>
                                <Txt variant="mono" tone="accent">
                                    {bookingUrl(username || 'you', title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meeting')}
                                </Txt>
                            </Card>
                        </Animated.View>
                    </>
                )}
            </Animated.View>

            {error ? (
                <Txt tone="danger" style={{ marginTop: spacing.md }}>
                    {error}
                </Txt>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl }}>
                {step > 0 ? <Button title="Back" variant="secondary" onPress={() => setStep(step - 1)} /> : null}
                <Button title={step < 2 ? 'Continue' : 'Start scheduling'} icon={step < 2 ? 'arrow-forward' : 'rocket-outline'} onPress={next} loading={saving} disabled={step === 2 && username.length < 3} style={{ flex: 1 }} />
            </View>
        </Screen>
    );
}
