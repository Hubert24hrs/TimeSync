import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SlotCard } from '../src/components/Cards';
import { newId, savePoll } from '../src/data/api';
import { toParticipant } from '../src/data/demo';
import { findOptimalSlots, overlaps } from '../src/engine';
import { useSubscription } from '../src/hooks/useSubscription';
import { usePeople, useWorkspace } from '../src/hooks/useWorkspace';
import { exportIcs } from '../src/lib/files';
import { haptics } from '../src/lib/haptics';
import { spacing, useTheme } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Avatar, Button, Card, Chip, EmptyState, Field, ListRow, SectionHeader, Txt } from '../src/ui/primitives';

export default function NewMeeting() {
    const { c } = useTheme();
    const params = useLocalSearchParams<{ mode?: string }>();
    const { me, team } = usePeople();
    const { bookings, eventTypes } = useWorkspace();
    const { can } = useSubscription();
    const [title, setTitle] = useState(params.mode === 'poll' ? 'Team sync' : 'Team meeting');
    const [invited, setInvited] = useState<string[]>(() => team.slice(0, 4).map((t) => t.id));
    const [optional, setOptional] = useState<string[]>([]);
    const [duration, setDuration] = useState(60);
    const [days, setDays] = useState(5);
    const [noNights, setNoNights] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(0);
    const [busy, setBusy] = useState(false);
    const zone = me?.timezone ?? 'UTC';
    const energyRanking = can('chronotypes');

    const conflicts = useMemo(() => {
        const upcoming = bookings.filter((b) => b.status === 'confirmed' && Date.parse(b.end) > Date.now()).map((b) => ({ ...b, s: Date.parse(b.start), e: Date.parse(b.end) }));
        const out: [typeof upcoming[number], typeof upcoming[number]][] = [];
        upcoming.forEach((a, i) => upcoming.slice(i + 1).forEach((b) => overlaps({ start: a.s, end: a.e }, { start: b.s, end: b.e }) && out.push([a, b])));
        return out;
    }, [bookings]);

    const people = useMemo(() => (me ? [me, ...team.filter((t) => invited.includes(t.id))] : []), [me, team, invited]);
    const slots = useMemo(() => {
        if (people.length === 0) return [];
        const now = Date.now();
        // Busy time from my confirmed bookings; teammates' busy time comes from calendar sync in cloud mode.
        const myBusy = bookings.filter((b) => b.status === 'confirmed').map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
        const participants = people.map((p) => ({ ...toParticipant(p), optional: optional.includes(p.id), busy: p.id === me?.id ? myBusy : undefined }));
        return findOptimalSlots(participants, {
            durationMinutes: duration,
            from: now + 2 * 3_600_000,
            to: now + days * 86_400_000,
            excludeNight: noNights,
            limit: 6,
            minGapMinutes: 120,
            weights: energyRanking ? { fairness: 0.65, energy: 0.35 } : { fairness: 1, energy: 0 },
        });
    }, [people, optional, duration, days, noNights, energyRanking, bookings, me?.id]);

    const toggle = (id: string) => {
        haptics.select();
        if (!invited.includes(id)) setInvited([...invited, id]);
        else if (!optional.includes(id)) setOptional([...optional, id]);
        else {
            setInvited(invited.filter((x) => x !== id));
            setOptional(optional.filter((x) => x !== id));
        }
    };

    const createPoll = async () => {
        setBusy(true);
        const id = newId();
        await savePoll({
            id,
            title,
            durationMinutes: duration,
            status: 'open',
            participantIds: people.map((p) => p.id),
            options: slots.slice(0, 4).map((s) => ({ id: newId(), start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString() })),
            votes: [],
            createdAt: new Date().toISOString(),
        });
        haptics.success();
        setBusy(false);
        router.replace(`/poll/${id}`);
    };

    const sendInvite = async (i: number) => {
        const s = slots[i];
        await exportIcs('meeting.ics', [
            { uid: `${newId()}@timesync.app`, title, start: s.start, end: s.end, description: `Fairness ${s.fairnessScore} · Energy ${s.energyScore}\n${s.pros.join('\n')}`, organizer: me ? { name: me.name, email: me.email || 'organizer@timesync.app' } : undefined, attendees: people.filter((p) => p.id !== me?.id).map((p) => ({ name: p.name, email: p.email })) },
        ]);
        haptics.success();
    };

    return (
        <Screen title={params.mode === 'poll' ? 'New poll' : 'New meeting'} subtitle="Fair across zones, holidays and workweeks" back="close">
            {conflicts.length ? (
                <Card accent={c.warning} style={{ gap: 6, marginBottom: spacing.lg }}>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                        <Ionicons name="warning-outline" size={18} color={c.warning} />
                        <Txt variant="bodyStrong">{conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''}</Txt>
                    </View>
                    {conflicts.slice(0, 3).map(([a, b]) => (
                        <Txt key={a.id + b.id} variant="caption" tone="secondary">
                            {eventTypes.find((e) => e.id === a.eventTypeId)?.title} ({a.inviteeName}) overlaps {eventTypes.find((e) => e.id === b.eventTypeId)?.title} ({b.inviteeName}) · {DateTime.fromISO(a.start, { zone }).toFormat('ccc HH:mm')}
                        </Txt>
                    ))}
                </Card>
            ) : null}

            <Field label="Title" value={title} onChangeText={setTitle} maxLength={120} />
            <SectionHeader title="Who" />
            <Txt variant="caption" tone="muted" style={{ marginBottom: spacing.sm }}>
                Tap to invite, tap again to mark optional, again to remove.
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {team.map((t) => (
                    <Chip key={t.id} label={`${t.name.split(' ')[0]}${optional.includes(t.id) ? ' (optional)' : ''}`} selected={invited.includes(t.id)} color={optional.includes(t.id) ? c.accent : undefined} onPress={() => toggle(t.id)} />
                ))}
            </View>

            <SectionHeader title="How long, how soon" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {[30, 45, 60, 90].map((d) => (
                    <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
                ))}
                <View style={{ width: spacing.md }} />
                {[3, 5, 10].map((d) => (
                    <Chip key={d} label={`Next ${d} days`} selected={days === d} onPress={() => setDays(d)} />
                ))}
            </View>
            <Card style={{ paddingVertical: 0, marginTop: spacing.md }}>
                <ListRow icon="moon-outline" title="Never at night" subtitle="Skip slots between 23:00 and 06:00 for required people" toggle={noNights} onToggle={setNoNights} />
                <ListRow
                    icon="flash-outline"
                    title="Rank by team energy"
                    subtitle={energyRanking ? 'Chronotype-aware ranking is on' : 'Pro: blend energy into the ranking'}
                    toggle={energyRanking}
                    onToggle={() => !energyRanking && router.push({ pathname: '/paywall', params: { feature: 'chronotypes' } })}
                    last
                />
            </Card>

            <SectionHeader title="Best options" />
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: spacing.md, flexWrap: 'wrap' }}>
                {people.map((p) => (
                    <Avatar key={p.id} name={p.name} id={p.id} size={30} />
                ))}
            </View>
            {slots.length === 0 ? (
                <EmptyState icon="moon-outline" title="No fair slot found" body="Try a longer window, a shorter meeting, or allow night-time for optional people." />
            ) : (
                slots.map((s, i) => (
                    <Animated.View key={s.start} entering={FadeInDown.delay(i * 60)} layout={LinearTransition}>
                        <SlotCard slot={s} zone={zone} best={i === 0} expanded={expanded === i} onPress={() => setExpanded(expanded === i ? null : i)} />
                        {expanded === i ? (
                            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: -spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
                                <Button title="Send invite (.ics)" icon="paper-plane-outline" size="sm" onPress={() => sendInvite(i)} />
                            </View>
                        ) : null}
                    </Animated.View>
                ))
            )}
            {slots.length > 1 ? <Button title="Let the group vote (poll top 4)" icon="stats-chart-outline" variant={params.mode === 'poll' ? 'primary' : 'secondary'} loading={busy} onPress={createPoll} style={{ marginTop: spacing.md }} /> : null}
        </Screen>
    );
}
