import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { FeatureGate } from '../src/components/Monetization';
import { toParticipant } from '../src/data/demo';
import { computeAnalytics } from '../src/engine';
import { usePeople, useWorkspace } from '../src/hooks/useWorkspace';
import { radius, scoreColor, spacing, useTheme } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Card, Chip, SectionHeader, Stat, Txt } from '../src/ui/primitives';

function Bars({ data }: { data: { label: string; value: number; color?: string }[] }) {
    const { c } = useTheme();
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <View style={{ gap: spacing.sm }}>
            {data.map((d) => (
                <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} accessibilityLabel={`${d.label}: ${d.value}`}>
                    <Txt variant="caption" tone="secondary" style={{ width: 110 }} numberOfLines={1}>
                        {d.label}
                    </Txt>
                    <View style={{ flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: c.border, overflow: 'hidden' }}>
                        <View style={{ width: `${(d.value / max) * 100}%`, height: '100%', borderRadius: radius.pill, backgroundColor: d.color ?? c.primary }} />
                    </View>
                    <Txt variant="mono" style={{ width: 40, textAlign: 'right' }}>
                        {d.value}
                    </Txt>
                </View>
            ))}
        </View>
    );
}

export default function Analytics() {
    const { c } = useTheme();
    const { bookings, eventTypes } = useWorkspace();
    const { all } = usePeople();
    const [days, setDays] = useState(30);
    const recent = useMemo(() => bookings.filter((b) => Date.parse(b.start) >= Date.now() - days * 86_400_000), [bookings, days]);
    const a = useMemo(() => computeAnalytics(recent, all.map(toParticipant)), [recent, all]);
    const cancelRate = recent.length ? Math.round((a.cancelled / recent.length) * 100) : 0;
    const fairnessBuckets = [
        { label: '85–100 (fair)', value: recent.filter((b) => (b.fairnessScore ?? 0) >= 85).length, color: c.success },
        { label: '65–84', value: recent.filter((b) => (b.fairnessScore ?? 0) >= 65 && (b.fairnessScore ?? 0) < 85).length, color: c.warning },
        { label: '< 65 (costly)', value: recent.filter((b) => b.fairnessScore !== undefined && b.fairnessScore < 65).length, color: c.danger },
    ];

    return (
        <Screen title="Analytics" subtitle="Meetings booked, fairness and after-hours load" back>
            <FeatureGate feature="analytics">
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
                    {[7, 30, 90].map((d) => (
                        <Chip key={d} label={`${d} days`} selected={days === d} onPress={() => setDays(d)} />
                    ))}
                </View>
                <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
                    <Stat label="Meetings booked" value={String(a.meetingsBooked)} icon="calendar-outline" />
                    <Stat label="Avg fairness" value={a.averageFairness !== null ? String(a.averageFairness) : '—'} icon="scale-outline" tone={a.averageFairness !== null ? scoreColor(a.averageFairness, c) : undefined} />
                    <Stat label="Cancel rate" value={`${cancelRate}%`} icon="close-circle-outline" tone={c.warning} />
                    <Stat label="No-shows" value={String(a.noShows)} icon="person-remove-outline" tone={c.danger} />
                </Card>

                <SectionHeader title="Per week" />
                <Card>{a.perWeek.length ? <Bars data={a.perWeek.map((w) => ({ label: w.week, value: w.count }))} /> : <Txt tone="muted">No meetings in this period.</Txt>}</Card>

                <SectionHeader title="Fairness" />
                <Card style={{ gap: spacing.sm }}>
                    <Bars data={fairnessBuckets} />
                    <Txt variant="caption" tone="muted">
                        Fairness is scored when a meeting is booked, from every attendee’s local hours, weekends and holidays.
                    </Txt>
                </Card>

                <SectionHeader title="After-hours load" />
                <Card style={{ gap: spacing.sm }}>
                    <Bars data={all.map((p) => ({ label: p.name.split(' ')[0], value: Math.round((a.afterHoursMinutes[p.id] ?? 0) / 60), color: c.warning }))} />
                    <Txt variant="caption" tone="muted">
                        Hours each host spent in meetings outside their working hours.
                    </Txt>
                </Card>

                <SectionHeader title="By event type" />
                <Card>
                    <Bars data={eventTypes.map((e) => ({ label: e.title, value: recent.filter((b) => b.eventTypeId === e.id && b.status !== 'cancelled').length, color: e.color }))} />
                </Card>
            </FeatureGate>
        </Screen>
    );
}
