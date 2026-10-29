import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SlotPicker } from '../../src/components/SlotPicker';
import { fetchManagedBooking, fetchPublicEvent, manageBooking, type PublicSlot } from '../../src/data/api';
import { exportIcs } from '../../src/lib/files';
import { haptics } from '../../src/lib/haptics';
import { spacing, useTheme } from '../../src/theme';
import { Screen } from '../../src/ui/Screen';
import { Badge, Button, Card, EmptyState, Field, Segmented, Skeleton, Txt } from '../../src/ui/primitives';

/** Emailed manage link (no login): reschedule or cancel with a signed token. */
export default function ManageBooking() {
    const { c } = useTheme();
    const { id, token = '' } = useLocalSearchParams<{ id: string; token?: string }>();
    const qc = useQueryClient();
    const [mode, setMode] = useState<'reschedule' | 'cancel'>('reschedule');
    const [slot, setSlot] = useState<PublicSlot | null>(null);
    const [reason, setReason] = useState('');
    const [done, setDone] = useState<string | null>(null);

    const booking = useQuery({ queryKey: ['managed', id, token], queryFn: () => fetchManagedBooking(id, token), enabled: !!token });
    const b = booking.data?.booking;
    const zone = b?.invitee.timezone ?? 'UTC';
    const slots = useQuery({
        queryKey: ['public-event', booking.data?.host.username, b?.eventType.slug, zone, 'reschedule'],
        queryFn: () => fetchPublicEvent(booking.data!.host.username, b!.eventType.slug, zone, Date.now()),
        enabled: !!b && mode === 'reschedule' && b.status === 'confirmed',
    });
    const act = useMutation({
        mutationFn: () => manageBooking(id, token, mode, slot?.start, reason || undefined),
        onSuccess: () => {
            haptics.success();
            setDone(mode === 'cancel' ? 'Your meeting is cancelled. The host has been notified.' : `Moved to ${DateTime.fromISO(slot!.start, { zone }).toFormat('cccc d LLLL · HH:mm')}. Updated invites are on their way.`);
            qc.invalidateQueries({ queryKey: ['managed'] });
        },
    });

    if (!token) return <Screen><EmptyState icon="key-outline" title="Missing link token" body="Open the link from your confirmation email." /></Screen>;
    if (booking.error) return <Screen><EmptyState icon="alert-circle-outline" title="Link invalid or expired" body={booking.error instanceof Error ? booking.error.message : undefined} /></Screen>;
    if (!b) return <Screen><View style={{ gap: spacing.md, marginTop: spacing.xxl }}><Skeleton height={28} width="50%" /><Skeleton height={120} /></View></Screen>;

    const start = DateTime.fromISO(b.start, { zone });
    return (
        <Screen title="Your meeting" maxWidth={760}>
            <Card style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Txt variant="h3">{b.eventType.title}</Txt>
                    <Badge tone={b.status === 'confirmed' ? 'success' : 'warning'} label={b.status} />
                </View>
                <Txt tone="secondary">with {booking.data!.host.name}</Txt>
                <Txt variant="mono">{start.toFormat('cccc d LLLL · HH:mm')} ({zone.replace(/_/g, ' ')})</Txt>
                <Button
                    title="Add to calendar"
                    size="sm"
                    variant="ghost"
                    icon="calendar-outline"
                    onPress={() => exportIcs('meeting.ics', [{ uid: `${b.id}@timesync.app`, title: b.eventType.title, start: Date.parse(b.start), end: Date.parse(b.end), url: b.meetingUrl ?? undefined }])}
                />
            </Card>

            {done ? (
                <Card accent={c.success} style={{ marginTop: spacing.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={22} color={c.success} />
                    <Txt style={{ flex: 1 }}>{done}</Txt>
                </Card>
            ) : b.status === 'confirmed' && Date.parse(b.start) > Date.now() ? (
                <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
                    <Segmented value={mode} onChange={setMode} options={[{ value: 'reschedule', label: 'Reschedule' }, { value: 'cancel', label: 'Cancel' }]} />
                    {mode === 'reschedule' ? <SlotPicker page={slots.data} loading={slots.isLoading} selected={slot?.start} onSelect={setSlot} /> : <Field label="Reason (optional)" value={reason} onChangeText={setReason} multiline maxLength={500} />}
                    {act.error ? <Txt tone="danger">{act.error instanceof Error ? act.error.message : 'Something went wrong'}</Txt> : null}
                    <Button
                        title={mode === 'cancel' ? 'Cancel meeting' : 'Confirm new time'}
                        variant={mode === 'cancel' ? 'danger' : 'primary'}
                        disabled={mode === 'reschedule' && !slot}
                        loading={act.isPending}
                        onPress={() => act.mutate()}
                    />
                </View>
            ) : (
                <Txt tone="muted" style={{ marginTop: spacing.lg }}>
                    This meeting can no longer be changed.
                </Txt>
            )}
        </Screen>
    );
}
