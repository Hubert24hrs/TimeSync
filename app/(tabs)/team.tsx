import { router } from 'expo-router';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { OverlapHeatmap, TimeZoneCard } from '../../src/components/Clocks';
import { Globe } from '../../src/components/Globe';
import { energyAt, localHour, overlapHeatmap, workweekLabel, cityFromZone } from '../../src/engine';
import { useLayout } from '../../src/hooks/useLayout';
import { useNow } from '../../src/hooks/useNow';
import { useSubscription } from '../../src/hooks/useSubscription';
import { usePeople } from '../../src/hooks/useWorkspace';
import { chronotypeColors, spacing, useTheme } from '../../src/theme';
import type { Profile } from '../../src/types';
import { Grid, Screen } from '../../src/ui/Screen';
import { Avatar, Badge, Button, Card, Chip, EmptyState, SectionHeader, Txt } from '../../src/ui/primitives';

const EMOJI = { lion: '🦁', bear: '🐻', wolf: '🐺', dolphin: '🐬' } as const;

function MemberRow({ p, now, showEnergy }: { p: Profile; now: number; showEnergy: boolean }) {
    const { c } = useTheme();
    const h = localHour(now, p.timezone);
    const working = h >= p.workingHours.start && h < p.workingHours.end;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Avatar name={p.name} id={p.id} status={p.status} />
            <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{p.name}</Txt>
                <Txt variant="caption" tone="muted">
                    {p.role ?? 'Teammate'} · {cityFromZone(p.timezone)} · {workweekLabel(p.countryCode)}
                </Txt>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Txt variant="mono">{DateTime.fromMillis(now, { zone: p.timezone }).toFormat('HH:mm')}</Txt>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    {showEnergy ? <Badge label={`${EMOJI[p.chronotype]} ${Math.round(energyAt(p.chronotype, h))}/10`} /> : null}
                    <Badge tone={working ? 'success' : 'neutral'} label={working ? 'Working' : 'Off'} />
                </View>
            </View>
        </View>
    );
}

export default function Team() {
    const { c } = useTheme();
    const { contentWidth, isWide } = useLayout();
    const now = useNow(30_000);
    const { can } = useSubscription();
    const { me, team, all, participants } = usePeople();
    const [dayOffset, setDayOffset] = useState(0);
    const [selected, setSelected] = useState<Profile | null>(null);
    const zone = me?.timezone ?? 'UTC';
    const date = DateTime.fromMillis(now, { zone }).plus({ days: dayOffset }).toISODate()!;

    const heat = useMemo(() => overlapHeatmap(participants, date, zone), [participants, date, zone]);
    const bestHours = heat.filter((h) => h.available === Math.max(...heat.map((x) => x.available)) && h.available > 0).map((h) => h.hour);
    const zones = useMemo(() => {
        const map = new Map<string, Profile[]>();
        for (const p of all) map.set(p.timezone, [...(map.get(p.timezone) ?? []), p]);
        return [...map.entries()];
    }, [all]);

    if (!team.length) {
        return (
            <Screen title="Team" tabSpacing>
                <EmptyState icon="people-outline" title="No teammates yet" body="Invite your team to see their clocks, energy and overlap." />
            </Screen>
        );
    }

    const globeWidth = Math.min(isWide ? contentWidth - 64 : contentWidth - 32, 900);
    return (
        <Screen title="Team" subtitle={`${all.length} people · ${zones.length} time zones`} tabSpacing>
            <Card padded={false} style={{ padding: spacing.sm, alignItems: 'center' }}>
                <Globe members={all} width={globeWidth} onSelect={setSelected} />
            </Card>
            {selected ? (
                <Card accent={chronotypeColors[selected.chronotype]} style={{ marginTop: spacing.md, flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <Avatar name={selected.name} id={selected.id} status={selected.status} size={48} />
                    <View style={{ flex: 1 }}>
                        <Txt variant="bodyStrong">{selected.name}</Txt>
                        <Txt variant="caption" tone="muted">
                            {selected.role} · {selected.timezone}
                        </Txt>
                    </View>
                    <Txt variant="clock">{DateTime.fromMillis(now, { zone: selected.timezone }).toFormat('HH:mm')}</Txt>
                </Card>
            ) : null}

            <SectionHeader title="Overlap" />
            <Card style={{ gap: spacing.md }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <Chip key={d} label={d === 0 ? 'Today' : DateTime.fromMillis(now, { zone }).plus({ days: d }).toFormat('ccc d')} selected={dayOffset === d} onPress={() => setDayOffset(d)} />
                    ))}
                </ScrollView>
                <OverlapHeatmap data={heat} nowHour={dayOffset === 0 ? Math.floor(localHour(now, zone)) : undefined} />
                <Txt variant="caption" tone="secondary">
                    {bestHours.length
                        ? `Best overlap (your time): ${bestHours.map((h) => `${String(h).padStart(2, '0')}:00`).slice(0, 4).join(', ')} — ${heat[bestHours[0]].available} of ${all.length} in working hours, regional weekends and holidays included.`
                        : 'Nobody overlaps on this day (weekend or holiday for most).'}
                </Txt>
                <Button title="Find the fairest time" icon="sparkles-outline" size="sm" onPress={() => router.push('/new-meeting')} />
            </Card>

            <SectionHeader title="Clocks" />
            <Grid columns={isWide ? 3 : undefined}>
                {zones.map(([z, people]) => (
                    <TimeZoneCard key={z} timezone={z} people={people.map((p) => p.name.split(' ')[0])} countryCode={people[0].countryCode} />
                ))}
            </Grid>

            <SectionHeader title="People" action="Cultural calendar" onAction={() => router.push('/cultural-calendar')} />
            <Card style={{ paddingVertical: 0 }}>
                {all.map((p) => (
                    <MemberRow key={p.id} p={p} now={now} showEnergy={can('chronotypes')} />
                ))}
            </Card>
            {!can('chronotypes') ? (
                <Txt variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                    Pro shows each teammate’s live energy and ranks slots by it.
                </Txt>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' }}>
                <Button title="Routing forms" icon="git-branch-outline" variant="secondary" onPress={() => router.push('/routing')} />
                <Button title="Integrations" icon="extension-puzzle-outline" variant="secondary" onPress={() => router.push('/integrations')} />
            </View>
            <View style={{ height: spacing.md, backgroundColor: c.bg }} />
        </Screen>
    );
}
