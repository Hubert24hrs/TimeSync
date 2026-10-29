import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import React from 'react';
import { View } from 'react-native';
import { cityFromZone, type SlotScore } from '../engine';
import { useHour12 } from '../hooks/useWorkspace';
import { spacing, useTheme } from '../theme';
import type { Booking, EventType } from '../types';
import { Badge, Card, ScoreBadge, Txt } from '../ui/primitives';

const STATUS_TONE = { confirmed: 'success', completed: 'neutral', cancelled: 'danger', rescheduled: 'warning', no_show: 'warning' } as const;

export function BookingCard({ booking, eventType, zone, onPress }: { booking: Booking; eventType?: EventType; zone: string; onPress?: () => void }) {
    const { c } = useTheme();
    const hour12 = useHour12();
    const start = DateTime.fromISO(booking.start, { zone });
    const end = DateTime.fromISO(booking.end, { zone });
    const theirs = DateTime.fromISO(booking.start, { zone: booking.inviteeTimezone });
    const fmt = hour12 ? 'h:mm a' : 'HH:mm';
    return (
        <Card onPress={onPress} accessibilityLabel={`${eventType?.title ?? 'Meeting'} with ${booking.inviteeName} at ${start.toFormat('h:mm a')}`} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ width: 4, borderRadius: 2, backgroundColor: eventType?.color ?? c.primary }} />
                <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                        <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                            {eventType?.title ?? 'Meeting'}
                        </Txt>
                        <Badge tone={STATUS_TONE[booking.status]} label={booking.status.replace('_', '-')} />
                    </View>
                    <Txt variant="mono" tone="secondary">
                        {start.toFormat(fmt)} – {end.toFormat(fmt)}
                    </Txt>
                    <Txt variant="caption" tone="muted">
                        {booking.inviteeName} · their time {theirs.toFormat(fmt)} ({cityFromZone(booking.inviteeTimezone)})
                    </Txt>
                    {booking.fairnessScore !== undefined ? (
                        <View style={{ flexDirection: 'row', marginTop: 2 }}>
                            <ScoreBadge kind="fairness" value={booking.fairnessScore} />
                        </View>
                    ) : null}
                </View>
            </View>
        </Card>
    );
}

const BAND_LABEL = { ideal: 'Working hours', stretch: 'Early / late', unsocial: 'Unsocial', night: 'Night', off_day: 'Weekend', holiday: 'Holiday' } as const;

/** An optimizer suggestion with each participant's local time and burden. */
export function SlotCard({ slot, zone, best, expanded, onPress }: { slot: SlotScore; zone: string; best?: boolean; expanded?: boolean; onPress?: () => void }) {
    const { c } = useTheme();
    const hour12 = useHour12();
    const fmt = hour12 ? 'h:mm a' : 'HH:mm';
    const start = DateTime.fromMillis(slot.start, { zone });
    const bandColor = { ideal: c.success, stretch: c.warning, unsocial: c.danger, night: c.danger, off_day: c.danger, holiday: c.danger } as const;
    return (
        <Card onPress={onPress} accent={best ? c.primary : undefined} style={{ marginBottom: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                    {best ? <Badge tone="primary" icon="trophy-outline" label="Best match" /> : null}
                    <Txt variant="h3" style={{ marginTop: best ? 6 : 0 }}>
                        {start.toFormat(`ccc d LLL · ${fmt}`)}
                    </Txt>
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                    <ScoreBadge kind="fairness" value={slot.fairnessScore} />
                    <ScoreBadge kind="energy" value={slot.energyScore} />
                </View>
            </View>
            {slot.pros.slice(0, 2).map((p) => (
                <View key={p} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={14} color={c.success} />
                    <Txt variant="caption" tone="secondary">
                        {p}
                    </Txt>
                </View>
            ))}
            {slot.cons.slice(0, expanded ? 10 : 2).map((p) => (
                <View key={p} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Ionicons name="alert-circle" size={14} color={c.warning} />
                    <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
                        {p}
                    </Txt>
                </View>
            ))}
            {expanded ? (
                <View style={{ marginTop: spacing.sm, gap: 6 }}>
                    {slot.participants.map((p) => (
                        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bandColor[p.band] }} />
                            <Txt variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                                {p.name} · {cityFromZone(p.timezone)}
                            </Txt>
                            <Txt variant="mono" tone="secondary">
                                {DateTime.fromMillis(slot.start, { zone: p.timezone }).toFormat(fmt)}
                            </Txt>
                            <Txt variant="caption" tone="muted" style={{ width: 92, textAlign: 'right' }}>
                                {BAND_LABEL[p.band]}
                            </Txt>
                        </View>
                    ))}
                </View>
            ) : null}
        </Card>
    );
}
