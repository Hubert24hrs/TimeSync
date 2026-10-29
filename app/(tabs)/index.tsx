import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookingCard, SlotCard } from '../../src/components/Cards';
import { TimeZoneCard } from '../../src/components/Clocks';
import { EnergyCurve, EnergyMeter } from '../../src/components/Energy';
import { AdBanner } from '../../src/components/Monetization';
import { ShareLinkCard } from '../../src/components/ShareLink';
import { computeAnalytics, energyAt, findOptimalSlots, holidaysBetween, localHour, nextDstTransition, cityFromZone } from '../../src/engine';
import { useLayout } from '../../src/hooks/useLayout';
import { useNow } from '../../src/hooks/useNow';
import { useSubscription } from '../../src/hooks/useSubscription';
import { usePeople, useWorkspace } from '../../src/hooks/useWorkspace';
import { toParticipant } from '../../src/data/demo';
import { spacing, useTheme } from '../../src/theme';
import { Screen } from '../../src/ui/Screen';
import { Badge, Button, Card, EmptyState, SectionHeader, Stat, Txt } from '../../src/ui/primitives';

function greeting(hour: number): string {
    if (hour < 5) return 'Burning the midnight oil';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Today() {
    const { c } = useTheme();
    const { columns } = useLayout();
    const now = useNow(60_000);
    const { can } = useSubscription();
    const { bookings, eventTypes } = useWorkspace();
    const { me, team, participants } = usePeople();

    const zone = me?.timezone ?? 'UTC';
    const today = DateTime.fromMillis(now, { zone });
    const hour = localHour(now, zone);

    const upcoming = useMemo(
        () => bookings.filter((b) => b.hostId === me?.id && b.status === 'confirmed' && Date.parse(b.end) > now).sort((a, b) => a.start.localeCompare(b.start)),
        [bookings, now, me?.id],
    );
    const todays = upcoming.filter((b) => DateTime.fromISO(b.start, { zone }).hasSame(today, 'day'));
    const next = upcoming[0];

    const week = useMemo(() => {
        const from = today.startOf('week').toISO()!;
        const inWeek = bookings.filter((b) => b.hostId === me?.id && b.start >= from && b.start < today.endOf('week').toISO()!);
        return computeAnalytics(inWeek, me ? [toParticipant(me)] : []);
    }, [bookings, me, today]);

    const suggestions = useMemo(
        () => (participants.length > 1 ? findOptimalSlots(participants, { durationMinutes: 60, from: now + 3_600_000, to: now + 5 * 86_400_000, limit: 2, minGapMinutes: 240 }) : []),
        // Recompute hourly, not every minute.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [participants, Math.floor(now / 3_600_000)],
    );

    const alerts = useMemo(() => {
        const countries = [...new Set([me, ...team].map((p) => p?.countryCode).filter((x): x is string => !!x))];
        const holidays = holidaysBetween(today.toISODate()!, today.plus({ days: 14 }).toISODate()!, countries).filter((h) => h.level === 'major').slice(0, 3);
        const zones = [...new Set([zone, ...team.map((t) => t.timezone)])];
        const dst = zones.map((z) => ({ z, t: nextDstTransition(z, now, 21) })).filter((d) => d.t).slice(0, 2);
        return { holidays, dst };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me, team, zone, today.toISODate()]);

    const zones = useMemo(() => {
        const map = new Map<string, { names: string[]; cc?: string }>();
        for (const p of team) {
            const entry = map.get(p.timezone) ?? { names: [], cc: p.countryCode };
            entry.names.push(p.name.split(' ')[0]);
            map.set(p.timezone, entry);
        }
        return [...map.entries()];
    }, [team]);

    if (!me) return <Screen tabSpacing><EmptyState icon="hourglass-outline" title="Loading your workspace" /></Screen>;

    const energy = energyAt(me.chronotype, hour);
    const primaryEvent = eventTypes.find((e) => e.ownerId === me.id && e.active);
    const half = columns > 1 ? { flexBasis: '48%', flexGrow: 1 } as const : { width: '100%' } as const;

    return (
        <Screen tabSpacing>
            <Animated.View entering={FadeInDown.duration(400)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.xl }}>
                <View style={{ flex: 1 }}>
                    <Txt tone="muted">{greeting(hour)},</Txt>
                    <Txt variant="display" accessibilityRole="header">
                        {me.name.split(' ')[0]}
                    </Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Txt variant="label" tone="primary">
                        {today.toFormat('cccc')}
                    </Txt>
                    <Txt variant="mono" tone="muted">
                        {today.toFormat('d LLL · HH:mm')}
                    </Txt>
                </View>
            </Animated.View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                <Animated.View entering={FadeInDown.delay(60)} style={half}>
                    <Card accent={c.primary} style={{ gap: spacing.sm, minHeight: 168 }} onPress={next ? () => router.push('/(tabs)/schedule') : undefined}>
                        <Txt variant="overline" tone="muted">
                            Next up
                        </Txt>
                        {next ? (
                            <>
                                <Txt variant="h2" numberOfLines={1}>
                                    {eventTypes.find((e) => e.id === next.eventTypeId)?.title ?? 'Meeting'}
                                </Txt>
                                <Txt tone="secondary">with {next.inviteeName}</Txt>
                                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Badge tone="primary" icon="time-outline" label={DateTime.fromISO(next.start, { zone }).toRelative({ base: DateTime.fromMillis(now) }) ?? ''} />
                                    <Txt variant="mono" tone="muted">
                                        {DateTime.fromISO(next.start, { zone }).toFormat('ccc HH:mm')}
                                    </Txt>
                                </View>
                            </>
                        ) : (
                            <Txt tone="muted">Nothing scheduled. Share your link to get booked.</Txt>
                        )}
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(120)} style={half}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, minHeight: 168 }}>
                        <EnergyMeter level={energy} size={92} />
                        <View style={{ flex: 1, gap: 6 }}>
                            <Txt variant="overline" tone="muted">
                                Your energy · {me.chronotype}
                            </Txt>
                            <EnergyCurve chronotype={me.chronotype} hour={hour} width={170} height={56} />
                            <Txt variant="caption" tone="secondary">
                                {energy >= 7 ? 'Peak window — protect it for deep work.' : energy >= 4 ? 'Good for collaborative meetings.' : 'Low ebb — keep it light.'}
                            </Txt>
                        </View>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(180)} style={{ width: '100%' }}>
                    <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
                        <Stat label="Booked this week" value={String(week.meetingsBooked)} icon="calendar-outline" />
                        <Stat label="Avg fairness" value={week.averageFairness !== null ? String(week.averageFairness) : '—'} icon="scale-outline" tone={c.success} />
                        <Stat label="After-hours" value={`${Math.round((week.afterHoursMinutes[me.id] ?? 0) / 60)}h`} icon="moon-outline" tone={c.warning} />
                        <Stat label="Today" value={String(todays.length)} icon="today-outline" tone={c.accent} />
                    </Card>
                </Animated.View>
            </View>

            {zones.length ? (
                <>
                    <SectionHeader title="Team clocks" action="Team" onAction={() => router.push('/(tabs)/team')} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                        {zones.map(([z, info]) => (
                            <TimeZoneCard key={z} timezone={z} people={info.names} countryCode={info.cc} compact />
                        ))}
                    </ScrollView>
                </>
            ) : null}

            {alerts.holidays.length || alerts.dst.length ? (
                <Card style={{ marginTop: spacing.lg, gap: spacing.sm }} accent={c.warning}>
                    <Txt variant="overline" tone="muted">
                        Heads-up
                    </Txt>
                    {alerts.holidays.map((h) => (
                        <Txt key={h.id} variant="caption" tone="secondary">
                            {h.emoji} {h.name} · {DateTime.fromISO(h.date).toFormat('ccc d LLL')} · {h.countries.filter((cc) => cc !== '*').slice(0, 4).join(', ') || 'Global'}
                        </Txt>
                    ))}
                    {alerts.dst.map((d) => (
                        <Txt key={d.z} variant="caption" tone="secondary">
                            🕐 Clocks change in {cityFromZone(d.z)} on {DateTime.fromMillis(d.t!.at, { zone: d.z }).toFormat('ccc d LLL')} — recurring meetings shift.
                        </Txt>
                    ))}
                </Card>
            ) : null}

            <SectionHeader title="Fairest times this week" action="Optimizer" onAction={() => router.push('/new-meeting')} />
            {suggestions.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                    {suggestions.map((s, i) => (
                        <View key={s.start} style={half}>
                            <SlotCard slot={s} zone={zone} best={i === 0} onPress={() => router.push('/new-meeting')} />
                        </View>
                    ))}
                </View>
            ) : (
                <EmptyState icon="people-outline" title="Add teammates" body="Suggestions appear once your team is here." />
            )}

            <SectionHeader title="Today" action="All" onAction={() => router.push('/(tabs)/schedule')} />
            {todays.length ? (
                todays.map((b) => <BookingCard key={b.id} booking={b} eventType={eventTypes.find((e) => e.id === b.eventTypeId)} zone={zone} />)
            ) : (
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Ionicons name="cafe-outline" size={20} color={c.accent} />
                    <Txt tone="secondary">No meetings left today.</Txt>
                </Card>
            )}

            {primaryEvent ? (
                <>
                    <SectionHeader title="Your booking link" action="Manage" onAction={() => router.push('/(tabs)/schedule')} />
                    <ShareLinkCard username={me.username} slug={primaryEvent.slug} title={primaryEvent.title} />
                    <Button title="Open booking page" icon="open-outline" variant="ghost" onPress={() => router.push(`/${me.username}/${primaryEvent.slug}`)} style={{ marginTop: spacing.sm }} />
                </>
            ) : null}

            {!can('analytics') ? null : (
                <Button title="View analytics" icon="stats-chart-outline" variant="secondary" onPress={() => router.push('/analytics')} style={{ marginTop: spacing.lg }} />
            )}
            <AdBanner />
        </Screen>
    );
}
