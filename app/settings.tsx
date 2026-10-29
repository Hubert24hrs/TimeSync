import Constants from 'expo-constants';
import React, { useState } from 'react';
import { View } from 'react-native';
import { ZonePicker } from '../src/components/ZonePicker';
import { seedDemoWorkspace, updateProfile } from '../src/data/api';
import { useMe } from '../src/hooks/useWorkspace';
import { registerForPush } from '../src/lib/push';
import { setHaptics, setHour12, setNotifications } from '../src/store/slices/settingsSlice';
import { useAppDispatch, useAppSelector } from '../src/store/store';
import { spacing, useTheme, type ThemeMode } from '../src/theme';
import type { Chronotype } from '../src/types';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Chip, Field, ListRow, SectionHeader, Segmented, Txt } from '../src/ui/primitives';

export default function Settings() {
    const { mode: theme, setMode } = useTheme();
    const dispatch = useAppDispatch();
    const me = useMe();
    const settings = useAppSelector((s) => s.settings);
    const auth = useAppSelector((s) => s.auth);
    const consent = useAppSelector((s) => s.ads);
    const [name, setName] = useState(me?.name ?? '');
    const [pushNote, setPushNote] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    if (!me) return null;

    return (
        <Screen title="Settings" back maxWidth={720}>
            <SectionHeader title="Profile" style={{ marginTop: 0 }} />
            <View style={{ gap: spacing.md }}>
                <Field label="Name" value={name} onChangeText={setName} maxLength={120} />
                <ZonePicker value={me.timezone} onChange={(timezone) => updateProfile({ timezone })} />
                <Txt variant="label" tone="secondary">
                    Chronotype
                </Txt>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    {(['lion', 'bear', 'wolf', 'dolphin'] as Chronotype[]).map((ct) => (
                        <Chip key={ct} label={ct} selected={me.chronotype === ct} onPress={() => updateProfile({ chronotype: ct })} />
                    ))}
                </View>
                <Txt variant="label" tone="secondary">
                    Working hours start
                </Txt>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    {[7, 8, 9, 10, 11].map((h) => (
                        <Chip key={h} label={`${h}:00–${h + 8}:00`} selected={me.workingHours.start === h} onPress={() => updateProfile({ workingHours: { start: h, end: h + 8 } })} />
                    ))}
                </View>
                <Button
                    title={saved ? 'Saved' : 'Save name'}
                    size="sm"
                    disabled={name.trim() === me.name || !name.trim()}
                    onPress={async () => {
                        await updateProfile({ name: name.trim() });
                        setSaved(true);
                    }}
                />
            </View>

            <SectionHeader title="Appearance" />
            <Segmented<ThemeMode>
                value={theme}
                onChange={setMode}
                options={[
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                    { value: 'auto', label: 'System' },
                ]}
            />
            <Card style={{ paddingVertical: 0, marginTop: spacing.md }}>
                <ListRow icon="time-outline" title="12-hour clock" toggle={settings.hour12} onToggle={(v) => dispatch(setHour12(v))} />
                <ListRow icon="pulse-outline" title="Haptics" toggle={settings.hapticsEnabled} onToggle={(v) => dispatch(setHaptics(v))} last />
            </Card>

            <SectionHeader title="Notifications" />
            <Card style={{ paddingVertical: 0 }}>
                <ListRow
                    icon="notifications-outline"
                    title="Booking reminders"
                    subtitle="Email 24h and 1h before; push on mobile; follow-up after"
                    toggle={settings.notificationsEnabled}
                    onToggle={async (v) => {
                        dispatch(setNotifications(v));
                        if (v && auth.mode === 'cloud' && auth.userId) setPushNote((await registerForPush(auth.userId)).message);
                    }}
                    last
                />
            </Card>
            {pushNote ? (
                <Txt variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                    {pushNote}
                </Txt>
            ) : null}

            <SectionHeader title="Privacy" />
            <Card style={{ paddingVertical: 0 }}>
                <ListRow icon="analytics-outline" title="Analytics" value={consent.analyticsConsent ? 'Allowed' : 'Off'} />
                <ListRow icon="megaphone-outline" title="Personalised ads" value={consent.personalizedAdsConsent ? 'Allowed' : 'Off'} last />
            </Card>

            {auth.mode === 'demo' ? (
                <>
                    <SectionHeader title="Demo" />
                    <Button title="Reset demo data" variant="secondary" icon="refresh" onPress={() => seedDemoWorkspace(me.timezone)} />
                </>
            ) : null}

            <Txt variant="caption" tone="muted" style={{ textAlign: 'center', marginTop: spacing.xxl }}>
                TimeSync {Constants.expoConfig?.version ?? ''} · {auth.mode === 'cloud' ? auth.email : 'demo mode'}
            </Txt>
        </Screen>
    );
}
