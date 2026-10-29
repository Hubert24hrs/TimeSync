import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SlotPicker } from '../../src/components/SlotPicker';
import { ZonePicker } from '../../src/components/ZonePicker';
import { createPublicBooking, fetchPublicEvent, seedDemoWorkspace, type PublicSlot } from '../../src/data/api';
import { detectTimeZone } from '../../src/engine';
import { isBackendConfigured } from '../../src/lib/config';
import { exportIcs } from '../../src/lib/files';
import { haptics } from '../../src/lib/haptics';
import { useAppSelector } from '../../src/store/store';
import { spacing, useTheme } from '../../src/theme';
import { Screen } from '../../src/ui/Screen';
import { Avatar, Badge, Button, Card, EmptyState, Field, Txt } from '../../src/ui/primitives';

const LOCATION = { google_meet: ['videocam-outline', 'Google Meet'], zoom: ['videocam-outline', 'Zoom'], phone: ['call-outline', 'Phone call'], in_person: ['location-outline', 'In person'], custom: ['link-outline', 'Online'] } as const;

/** Public, no-login booking page: timesync.app/<user>/<event>. */
export default function BookingPage() {
    const { c } = useTheme();
    const { user, event, embed } = useLocalSearchParams<{ user: string; event: string; embed?: string }>();
    const seeded = useAppSelector((s) => s.workspace.seeded);
    const mode = useAppSelector((s) => s.auth.mode);
    const [zone, setZone] = useState(detectTimeZone);
    const [slot, setSlot] = useState<PublicSlot | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [honeypot, setHoneypot] = useState('');

    // Without a backend the page runs against demo data on this device.
    const local = !isBackendConfigured || mode === 'demo';
    useEffect(() => {
        if (local && !seeded) seedDemoWorkspace();
    }, [local, seeded]);

    const query = useQuery({
        queryKey: ['public-event', user, event, zone, local],
        queryFn: () => fetchPublicEvent(user, event, zone, Date.now()),
        enabled: !local || seeded,
    });
    const book = useMutation({
        mutationFn: () => createPublicBooking({ username: user, eventSlug: event, start: slot!.start, name, email, timezone: zone, answers, website: honeypot || undefined }),
        onSuccess: () => haptics.success(),
        onError: () => haptics.warning(),
    });

    const page = query.data;
    const et = page?.eventType;
    const loc = et ? LOCATION[et.location] : null;

    if (query.error) {
        return (
            <Screen maxWidth={720}>
                <EmptyState icon="alert-circle-outline" title="Booking page not found" body={query.error instanceof Error ? query.error.message : undefined} />
            </Screen>
        );
    }

    if (book.data && et && page) {
        const start = DateTime.fromISO(book.data.booking.start, { zone });
        const [manageId, manageQuery] = book.data.manageUrl.replace(/^.*\/booking\//, '').split('?');
        return (
            <Screen maxWidth={640}>
                <Animated.View entering={FadeInDown} style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl }}>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={40} color={c.success} />
                    </View>
                    <Txt variant="h1" style={{ textAlign: 'center' }}>
                        You’re booked
                    </Txt>
                    <Txt tone="muted" style={{ textAlign: 'center' }}>
                        A confirmation with reschedule and cancel links is on its way to {email}.
                    </Txt>
                </Animated.View>
                <Card style={{ marginTop: spacing.xl, gap: spacing.sm }}>
                    <Txt variant="h3">{et.title}</Txt>
                    <Txt tone="secondary">with {page.host.name}</Txt>
                    <Txt variant="mono">{start.toFormat('cccc d LLLL · HH:mm')} ({zone.replace(/_/g, ' ')})</Txt>
                    {book.data.booking.meetingUrl ? <Button title="Join link" size="sm" variant="ghost" icon="videocam-outline" onPress={() => WebBrowser.openBrowserAsync(book.data.booking.meetingUrl!)} /> : null}
                </Card>
                <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                    <Button
                        title="Add to calendar (.ics)"
                        icon="calendar-outline"
                        onPress={() => exportIcs('meeting.ics', [{ uid: `${book.data.booking.id}@timesync.app`, title: `${et.title} with ${page.host.name}`, start: Date.parse(book.data.booking.start), end: Date.parse(book.data.booking.end), url: book.data.booking.meetingUrl ?? undefined }])}
                    />
                    <Button title="Reschedule or cancel" variant="secondary" icon="create-outline" onPress={() => router.push(`/booking/${manageId}?${manageQuery}`)} />
                </View>
            </Screen>
        );
    }

    const canSubmit = !!slot && name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && !book.isPending;

    return (
        <Screen maxWidth={980}>
            {page && et ? (
                <Animated.View entering={FadeIn} style={{ gap: spacing.md, marginBottom: spacing.xl }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <Avatar name={page.host.name} size={52} />
                        <View style={{ flex: 1 }}>
                            <Txt tone="muted">{page.host.name}</Txt>
                            <Txt variant="h1" accessibilityRole="header">
                                {et.title}
                            </Txt>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                        <Badge icon="time-outline" label={`${et.durationMinutes} min`} />
                        {loc ? <Badge icon={loc[0]} label={loc[1]} /> : null}
                        {et.kind !== 'one_on_one' ? <Badge tone="accent" icon="people-outline" label={et.hosts.map((h) => h.name.split(' ')[0]).join(', ')} /> : null}
                    </View>
                    {et.description ? <Txt tone="secondary">{et.description}</Txt> : null}
                </Animated.View>
            ) : null}

            <View style={{ gap: spacing.lg }}>
                <ZonePicker value={zone} onChange={(z) => { setZone(z); setSlot(null); }} label="Your time zone" />
                <SlotPicker page={page} loading={query.isLoading} selected={slot?.start} onSelect={setSlot} />

                {slot && et ? (
                    <Animated.View entering={FadeInDown} style={{ gap: spacing.md }}>
                        <Card accent={c.primary}>
                            <Txt variant="bodyStrong">{DateTime.fromISO(slot.start, { zone }).toFormat('cccc d LLLL · HH:mm')}</Txt>
                            <Txt variant="caption" tone="muted">
                                {et.durationMinutes} minutes · {zone.replace(/_/g, ' ')}
                            </Txt>
                        </Card>
                        <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={120} />
                        <Field label="Email" value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" autoCapitalize="none" maxLength={254} />
                        {et.questions.map((q) => (
                            <Field
                                key={q.id}
                                label={`${q.label}${q.required ? ' *' : ''}`}
                                value={answers[q.id] ?? ''}
                                onChangeText={(v) => setAnswers({ ...answers, [q.id]: v })}
                                multiline={q.type === 'textarea'}
                                keyboardType={q.type === 'phone' ? 'phone-pad' : 'default'}
                                hint={q.options ? `Options: ${q.options.join(', ')}` : undefined}
                                maxLength={2000}
                            />
                        ))}
                        {Platform.OS === 'web' ? (
                            // Honeypot for bots: hidden from people and screen readers.
                            <TextInput value={honeypot} onChangeText={setHoneypot} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} />
                        ) : null}
                        {book.error ? <Txt tone="danger">{book.error instanceof Error ? book.error.message : 'Booking failed'}</Txt> : null}
                        <Button title="Confirm booking" icon="checkmark-circle-outline" size="lg" disabled={!canSubmit} loading={book.isPending} onPress={() => book.mutate()} />
                    </Animated.View>
                ) : null}
            </View>
            {embed ? null : (
                <Txt variant="caption" tone="muted" style={{ textAlign: 'center', marginTop: spacing.xxl }}>
                    Scheduling by TimeSync · no account needed
                </Txt>
            )}
        </Screen>
    );
}
