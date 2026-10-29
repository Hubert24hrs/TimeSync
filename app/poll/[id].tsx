import { useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { closePoll, vote } from '../../src/data/api';
import { toParticipant } from '../../src/data/demo';
import { cityFromZone, pollHeat, pollWinner, scoreSlot, tallyPoll, type VoteAnswer } from '../../src/engine';
import { usePeople, useWorkspace } from '../../src/hooks/useWorkspace';
import { haptics } from '../../src/lib/haptics';
import { radius, spacing, useTheme } from '../../src/theme';
import { Screen } from '../../src/ui/Screen';
import { Avatar, Badge, Button, Card, Chip, EmptyState, ScoreBadge, Txt } from '../../src/ui/primitives';

const ANSWERS: { a: VoteAnswer; label: string }[] = [
    { a: 'yes', label: 'Yes' },
    { a: 'maybe', label: 'If needed' },
    { a: 'no', label: 'No' },
];

export default function PollScreen() {
    const { c } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { polls } = useWorkspace();
    const { me, all } = usePeople();
    const poll = polls.find((p) => p.id === id);
    const [closing, setClosing] = useState(false);
    const zone = me?.timezone ?? 'UTC';

    const computed = useMemo(() => {
        if (!poll) return null;
        const opts = poll.options.map((o) => ({ id: o.id, start: Date.parse(o.start), end: Date.parse(o.end) }));
        const people = all.filter((p) => poll.participantIds.includes(p.id));
        return {
            opts,
            people,
            tallies: tallyPoll(opts, poll.votes),
            heat: pollHeat(opts, poll.votes, Math.max(1, people.length)),
            leader: pollWinner(opts, poll.votes),
            fairness: Object.fromEntries(opts.map((o) => [o.id, scoreSlot(people.map(toParticipant), o).fairnessScore])),
        };
    }, [poll, all]);

    if (!poll || !computed || !me) {
        return (
            <Screen back title="Poll">
                <EmptyState icon="help-circle-outline" title="Poll not found" />
            </Screen>
        );
    }

    const myVote = (optionId: string) => poll.votes.find((v) => v.voterId === me.id && v.optionId === optionId)?.answer;
    const close = async () => {
        setClosing(true);
        await closePoll(poll);
        haptics.success();
        setClosing(false);
    };

    return (
        <Screen title={poll.title} subtitle={`${poll.durationMinutes} min · ${computed.people.length} people · ${poll.status}`} back maxWidth={820}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg }}>
                {computed.people.map((p) => (
                    <View key={p.id} style={{ alignItems: 'center', gap: 2, width: 64 }}>
                        <Avatar name={p.name} id={p.id} size={36} />
                        <Txt variant="caption" tone="muted" numberOfLines={1}>
                            {p.id === me.id ? 'You' : p.name.split(' ')[0]}
                        </Txt>
                        <Badge label={poll.votes.some((v) => v.voterId === p.id) ? 'voted' : 'waiting'} tone={poll.votes.some((v) => v.voterId === p.id) ? 'success' : 'neutral'} />
                    </View>
                ))}
            </View>

            {poll.options.map((o) => {
                const t = computed.tallies.find((x) => x.optionId === o.id)!;
                const heat = computed.heat[o.id] ?? 0;
                const isWinner = poll.winnerOptionId === o.id;
                const isLeader = computed.leader?.id === o.id && poll.status === 'open';
                return (
                    <Card key={o.id} accent={isWinner ? c.success : isLeader ? c.primary : undefined} style={{ marginBottom: spacing.md, gap: spacing.sm }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                            <View style={{ flex: 1 }}>
                                {isWinner ? <Badge tone="success" icon="checkmark-done" label="Booked" /> : isLeader ? <Badge tone="primary" icon="trending-up" label="Leading" /> : null}
                                <Txt variant="h3" style={{ marginTop: 4 }}>
                                    {DateTime.fromISO(o.start, { zone }).toFormat('ccc d LLL · HH:mm')}
                                </Txt>
                            </View>
                            <ScoreBadge kind="fairness" value={computed.fairness[o.id]} />
                        </View>
                        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: c.border, overflow: 'hidden' }} accessibilityLabel={`${Math.round(heat * 100)} percent support`}>
                            <View style={{ width: `${Math.round(heat * 100)}%`, height: '100%', backgroundColor: heat >= 0.75 ? c.success : heat >= 0.4 ? c.warning : c.danger }} />
                        </View>
                        <Txt variant="caption" tone="secondary">
                            {t.yes} yes · {t.maybe} if needed · {t.no} no
                        </Txt>
                        <Txt variant="caption" tone="muted" numberOfLines={2}>
                            {computed.people
                                .filter((p) => p.id !== me.id)
                                .map((p) => `${p.name.split(' ')[0]} ${DateTime.fromISO(o.start, { zone: p.timezone }).toFormat('HH:mm')} (${cityFromZone(p.timezone)})`)
                                .join(' · ')}
                        </Txt>
                        {poll.status === 'open' ? (
                            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                                {ANSWERS.map(({ a, label }) => (
                                    <Chip key={a} label={label} selected={myVote(o.id) === a} color={a === 'yes' ? c.success : a === 'maybe' ? c.warning : c.danger} onPress={() => vote(poll, o.id, a)} />
                                ))}
                            </View>
                        ) : null}
                    </Card>
                );
            })}

            {poll.status === 'open' ? (
                <Button title={computed.leader ? 'Close poll & book the winner' : 'Close poll'} icon="flag-outline" loading={closing} onPress={close} style={{ marginTop: spacing.md }} />
            ) : (
                <Card accent={c.success} style={{ marginTop: spacing.md }}>
                    <Txt variant="bodyStrong">
                        {poll.winnerOptionId ? `Booked for ${DateTime.fromISO(poll.options.find((o) => o.id === poll.winnerOptionId)!.start, { zone }).toFormat('cccc d LLLL, HH:mm')}` : 'Closed without a winner'}
                    </Txt>
                    <Txt variant="caption" tone="muted">
                        Invites go out from your connected calendar with a video link.
                    </Txt>
                </Card>
            )}
        </Screen>
    );
}
