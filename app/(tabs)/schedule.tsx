import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { Switch, View } from 'react-native';
import { BookingCard } from '../../src/components/Cards';
import { saveEventType, setBookingStatus } from '../../src/data/api';
import { canMarkNoShow, pollWinner, tallyPoll } from '../../src/engine';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useMe, useWorkspace } from '../../src/hooks/useWorkspace';
import { bookingUrl } from '../../src/lib/config';
import { exportIcs } from '../../src/lib/files';
import { haptics } from '../../src/lib/haptics';
import { spacing, useTheme } from '../../src/theme';
import type { Booking, EventType } from '../../src/types';
import { Screen } from '../../src/ui/Screen';
import { Badge, Button, Card, EmptyState, IconButton, Segmented, Txt } from '../../src/ui/primitives';

type Tab = 'upcoming' | 'past' | 'types' | 'polls';

const LOCATION_LABEL = { google_meet: 'Google Meet', zoom: 'Zoom', phone: 'Phone', in_person: 'In person', custom: 'Custom link' } as const;
const KIND_LABEL = { one_on_one: '1:1', group: 'Group', round_robin: 'Round-robin', collective: 'Collective' } as const;

function BookingActions({ booking, eventType, onDone }: { booking: Booking; eventType?: EventType; onDone: () => void }) {
    const now = Date.now();
    const upcoming = Date.parse(booking.start) > now && booking.status === 'confirmed';
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md }}>
            {booking.meetingUrl && upcoming ? <Button size="sm" title="Join" icon="videocam-outline" onPress={() => WebBrowser.openBrowserAsync(booking.meetingUrl!)} /> : null}
            <Button
                size="sm"
                variant="secondary"
                title=".ics"
                icon="download-outline"
                onPress={() =>
                    exportIcs(`${booking.id}.ics`, [{ uid: `${booking.id}@timesync.app`, title: eventType?.title ?? 'Meeting', start: Date.parse(booking.start), end: Date.parse(booking.end), url: booking.meetingUrl, attendees: [{ name: booking.inviteeName, email: booking.inviteeEmail }] }])
                }
            />
            {canMarkNoShow(booking, now) && booking.status !== 'no_show' ? (
                <Button size="sm" variant="secondary" title="Mark no-show" icon="person-remove-outline" onPress={() => setBookingStatus(booking, 'no_show').then(onDone)} />
            ) : null}
            {upcoming ? <Button size="sm" variant="danger" title="Cancel" icon="close-circle-outline" onPress={() => setBookingStatus(booking, 'cancelled').then(onDone)} /> : null}
        </View>
    );
}

export default function Schedule() {
    const { c } = useTheme();
    const me = useMe();
    const { bookings, eventTypes, polls } = useWorkspace();
    const { can, isFree } = useSubscription();
    const [tab, setTab] = useState<Tab>('upcoming');
    const [selected, setSelected] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const zone = me?.timezone ?? 'UTC';

    const grouped = useMemo(() => {
        const now = Date.now();
        const list = bookings
            .filter((b) => b.hostId === me?.id)
            .filter((b) => (tab === 'past' ? Date.parse(b.end) <= now : Date.parse(b.end) > now && b.status !== 'rescheduled'))
            .sort((a, b) => (tab === 'past' ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)));
        const days = new Map<string, Booking[]>();
        for (const b of list) {
            const key = DateTime.fromISO(b.start, { zone }).toISODate()!;
            days.set(key, [...(days.get(key) ?? []), b]);
        }
        return [...days.entries()];
    }, [bookings, tab, zone, me?.id]);

    const mine = eventTypes.filter((e) => e.ownerId === me?.id || e.hostIds.includes(me?.id ?? ''));
    const activeCount = mine.filter((e) => e.active && e.ownerId === me?.id).length;

    const toggleActive = async (e: EventType, active: boolean) => {
        setError(null);
        if (active && !can('unlimited_event_types') && activeCount >= 1) {
            haptics.warning();
            router.push({ pathname: '/paywall', params: { feature: 'unlimited_event_types' } });
            return;
        }
        try {
            await saveEventType({ ...e, active });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update');
        }
    };

    return (
        <Screen title="Schedule" tabSpacing right={<IconButton icon="time-outline" label="Availability" onPress={() => router.push('/availability')} />}>
            <Segmented
                value={tab}
                onChange={setTab}
                options={[
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'past', label: 'Past' },
                    { value: 'types', label: 'Event types' },
                    { value: 'polls', label: 'Polls' },
                ]}
            />
            <View style={{ height: spacing.lg }} />

            {tab === 'upcoming' || tab === 'past' ? (
                grouped.length ? (
                    grouped.map(([day, list]) => (
                        <View key={day}>
                            <Txt variant="overline" tone="muted" style={{ marginBottom: spacing.sm, marginTop: spacing.sm }}>
                                {DateTime.fromISO(day).toFormat('cccc d LLLL')}
                            </Txt>
                            {list.map((b) => {
                                const et = eventTypes.find((e) => e.id === b.eventTypeId);
                                return (
                                    <View key={b.id}>
                                        <BookingCard booking={b} eventType={et} zone={zone} onPress={() => setSelected(selected === b.id ? null : b.id)} />
                                        {selected === b.id ? <BookingActions booking={b} eventType={et} onDone={() => setSelected(null)} /> : null}
                                    </View>
                                );
                            })}
                        </View>
                    ))
                ) : (
                    <EmptyState icon="calendar-clear-outline" title={tab === 'past' ? 'No past meetings' : 'No upcoming meetings'} body="Share a booking link or create a poll to get started." action="New meeting" onAction={() => router.push('/new-meeting')} />
                )
            ) : null}

            {tab === 'types' ? (
                <View style={{ gap: spacing.md }}>
                    {isFree ? (
                        <Card accent={c.primary} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                            <Ionicons name="information-circle-outline" size={20} color={c.primary} />
                            <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>
                                Free plan: 1 active event type. Pro unlocks unlimited, calendar sync and AI.
                            </Txt>
                            <Button title="Upgrade" size="sm" onPress={() => router.push('/paywall')} />
                        </Card>
                    ) : null}
                    {error ? <Txt tone="danger">{error}</Txt> : null}
                    {mine.map((e) => (
                        <Card key={e.id} onPress={() => router.push(`/event-type/${e.id}`)} accessibilityLabel={`Edit ${e.title}`} style={{ gap: spacing.sm, opacity: e.active ? 1 : 0.7 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: e.color }} />
                                <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                                    {e.title}
                                </Txt>
                                <Switch accessibilityLabel={`${e.title} active`} value={e.active} onValueChange={(v) => toggleActive(e, v)} trackColor={{ true: c.primary, false: c.borderStrong }} thumbColor="#FFF" disabled={e.ownerId !== me?.id} />
                            </View>
                            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                                <Badge label={`${e.durationMinutes} min`} icon="time-outline" />
                                <Badge label={KIND_LABEL[e.kind]} tone={e.kind === 'one_on_one' ? 'neutral' : 'accent'} icon="people-outline" />
                                <Badge label={LOCATION_LABEL[e.location.kind]} icon="location-outline" />
                                {e.seats ? <Badge label={`${e.seats} seats`} /> : null}
                            </View>
                            {me ? (
                                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                                    <Txt variant="mono" tone="muted" style={{ flex: 1 }} numberOfLines={1}>
                                        {bookingUrl(me.username, e.slug).replace('https://', '')}
                                    </Txt>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        title={copied === e.id ? 'Copied' : 'Copy'}
                                        icon="copy-outline"
                                        onPress={async () => {
                                            await Clipboard.setStringAsync(bookingUrl(me.username, e.slug));
                                            haptics.success();
                                            setCopied(e.id);
                                        }}
                                    />
                                    <Button size="sm" variant="ghost" title="Preview" icon="eye-outline" onPress={() => router.push(`/${me.username}/${e.slug}`)} />
                                </View>
                            ) : null}
                        </Card>
                    ))}
                    <Button title="New event type" icon="add" onPress={() => router.push('/event-type/new')} />
                    <Button title="Routing forms" icon="git-branch-outline" variant="secondary" onPress={() => router.push('/routing')} />
                </View>
            ) : null}

            {tab === 'polls' ? (
                <View style={{ gap: spacing.md }}>
                    {polls.length === 0 ? <EmptyState icon="stats-chart-outline" title="No polls yet" body="Let a group vote on the fairest options, then auto-book the winner." /> : null}
                    {polls.map((p) => {
                        const opts = p.options.map((o) => ({ id: o.id, start: Date.parse(o.start), end: Date.parse(o.end) }));
                        const leader = p.winnerOptionId ? p.options.find((o) => o.id === p.winnerOptionId) : pollWinner(opts, p.votes);
                        const voters = new Set(p.votes.map((v) => v.voterId)).size;
                        const best = Math.max(0, ...tallyPoll(opts, p.votes).map((t) => t.yes));
                        return (
                            <Card key={p.id} onPress={() => router.push(`/poll/${p.id}`)} style={{ gap: 6 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Txt variant="bodyStrong">{p.title}</Txt>
                                    <Badge tone={p.status === 'open' ? 'info' : p.status === 'booked' ? 'success' : 'neutral'} label={p.status} />
                                </View>
                                <Txt variant="caption" tone="muted">
                                    {p.options.length} options · {voters} voted · top option has {best} yes
                                </Txt>
                                {leader ? (
                                    <Txt variant="mono" tone="secondary">
                                        {p.status === 'booked' ? 'Booked' : 'Leading'}: {DateTime.fromISO(typeof leader.start === 'string' ? leader.start : new Date(leader.start).toISOString(), { zone }).toFormat('ccc d LLL · HH:mm')}
                                    </Txt>
                                ) : null}
                            </Card>
                        );
                    })}
                    <Button title="New poll" icon="add" onPress={() => router.push({ pathname: '/new-meeting', params: { mode: 'poll' } })} />
                </View>
            ) : null}
        </Screen>
    );
}
