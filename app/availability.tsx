import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { ZonePicker } from '../src/components/ZonePicker';
import { deleteSchedule, newId, saveSchedule } from '../src/data/api';
import { formatClock, parseClock, scheduleSchema, type TimeRange, type Weekday } from '../src/engine';
import { useWorkspace } from '../src/hooks/useWorkspace';
import { haptics } from '../src/lib/haptics';
import { radius, spacing, useTheme } from '../src/theme';
import type { AvailabilitySchedule } from '../src/types';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Chip, Field, SectionHeader, Txt } from '../src/ui/primitives';

const DAYS: { d: Weekday; label: string }[] = [
    { d: 1, label: 'Monday' },
    { d: 2, label: 'Tuesday' },
    { d: 3, label: 'Wednesday' },
    { d: 4, label: 'Thursday' },
    { d: 5, label: 'Friday' },
    { d: 6, label: 'Saturday' },
    { d: 7, label: 'Sunday' },
];

function ClockStepper({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    const { c } = useTheme();
    const step = (delta: number) => {
        const next = Math.max(0, Math.min(24 * 60, parseClock(value) + delta));
        haptics.select();
        onChange(formatClock(next));
    };
    return (
        <View accessibilityLabel={`${label} ${value}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgAlt, borderRadius: radius.pill }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${label} earlier`} onPress={() => step(-30)} hitSlop={6} style={{ padding: 8 }}>
                <Ionicons name="remove" size={16} color={c.textSecondary} />
            </Pressable>
            <Txt variant="mono" style={{ minWidth: 46, textAlign: 'center' }}>
                {value}
            </Txt>
            <Pressable accessibilityRole="button" accessibilityLabel={`${label} later`} onPress={() => step(30)} hitSlop={6} style={{ padding: 8 }}>
                <Ionicons name="add" size={16} color={c.textSecondary} />
            </Pressable>
        </View>
    );
}

function RangesEditor({ ranges, onChange }: { ranges: TimeRange[]; onChange: (r: TimeRange[]) => void }) {
    const { c } = useTheme();
    return (
        <View style={{ gap: spacing.sm }}>
            {ranges.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <ClockStepper label="Start" value={r.start} onChange={(v) => onChange(ranges.map((x, j) => (j === i ? { ...x, start: v } : x)))} />
                    <Txt tone="muted">–</Txt>
                    <ClockStepper label="End" value={r.end} onChange={(v) => onChange(ranges.map((x, j) => (j === i ? { ...x, end: v } : x)))} />
                    <Pressable accessibilityRole="button" accessibilityLabel="Remove hours" onPress={() => onChange(ranges.filter((_, j) => j !== i))} hitSlop={8}>
                        <Ionicons name="close-circle-outline" size={20} color={c.textMuted} />
                    </Pressable>
                </View>
            ))}
            <Pressable accessibilityRole="button" onPress={() => onChange([...ranges, ranges.length ? { start: ranges[ranges.length - 1].end, end: formatClock(Math.min(1440, parseClock(ranges[ranges.length - 1].end) + 120)) } : { start: '09:00', end: '17:00' }])}>
                <Txt variant="label" tone="primary">
                    + Add hours
                </Txt>
            </Pressable>
        </View>
    );
}

export default function Availability() {
    const { c } = useTheme();
    const { schedules, me } = useWorkspace();
    const [selectedId, setSelectedId] = useState<string | undefined>(schedules[0]?.id);
    const [draft, setDraft] = useState<AvailabilitySchedule | null>(schedules[0] ?? null);
    const [overrideDate, setOverrideDate] = useState(DateTime.now().plus({ days: 7 }).toISODate()!);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setDraft(schedules.find((s) => s.id === selectedId) ?? null);
        setError(null);
    }, [selectedId, schedules]);

    const create = () => {
        const s: AvailabilitySchedule = { id: newId(), name: 'New schedule', timezone: me?.timezone ?? 'UTC', weekly: { 1: [{ start: '09:00', end: '17:00' }] }, overrides: [] };
        setDraft(s);
        setSelectedId(s.id);
    };

    const save = async () => {
        if (!draft) return;
        const parsed = scheduleSchema.safeParse(draft);
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? 'Check your hours');
            haptics.warning();
            return;
        }
        await saveSchedule(draft);
        haptics.success();
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <Screen title="Availability" subtitle="Weekly hours, date overrides and multiple schedules" back maxWidth={760}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {schedules.map((s) => (
                    <Chip key={s.id} label={s.name} selected={selectedId === s.id} onPress={() => setSelectedId(s.id)} />
                ))}
                {draft && !schedules.some((s) => s.id === draft.id) ? <Chip label={draft.name} selected /> : null}
                <Chip label="New" icon="add" onPress={create} />
            </ScrollView>

            {draft ? (
                <>
                    <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                        <Field label="Name" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} maxLength={80} />
                        <ZonePicker value={draft.timezone} onChange={(timezone) => setDraft({ ...draft, timezone })} label="Schedule time zone" />
                        <Txt variant="caption" tone="muted">
                            Hours follow this zone across DST changes. Invitees always see slots in their own zone.
                        </Txt>
                    </View>

                    <SectionHeader title="Weekly hours" />
                    <Card style={{ paddingVertical: 0 }}>
                        {DAYS.map(({ d, label }, i) => {
                            const ranges = draft.weekly[d] ?? [];
                            return (
                                <View key={d} style={{ paddingVertical: spacing.md, borderBottomWidth: i < 6 ? 1 : 0, borderBottomColor: c.border, gap: spacing.sm }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Txt variant="bodyStrong" style={{ flex: 1 }}>
                                            {label}
                                        </Txt>
                                        <Switch
                                            accessibilityLabel={`${label} available`}
                                            value={ranges.length > 0}
                                            onValueChange={(on) => setDraft({ ...draft, weekly: { ...draft.weekly, [d]: on ? [{ start: '09:00', end: '17:00' }] : [] } })}
                                            trackColor={{ true: c.primary, false: c.borderStrong }}
                                            thumbColor="#FFF"
                                        />
                                    </View>
                                    {ranges.length ? <RangesEditor ranges={ranges} onChange={(r) => setDraft({ ...draft, weekly: { ...draft.weekly, [d]: r } })} /> : <Txt variant="caption" tone="muted">Unavailable</Txt>}
                                </View>
                            );
                        })}
                    </Card>

                    <SectionHeader title="Date overrides" />
                    <Card style={{ gap: spacing.md }}>
                        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
                            <View style={{ flex: 1 }}>
                                <Field label="Date (YYYY-MM-DD)" value={overrideDate} onChangeText={setOverrideDate} autoCapitalize="none" maxLength={10} />
                            </View>
                            <Button
                                title="Add"
                                size="sm"
                                icon="add"
                                disabled={!DateTime.fromISO(overrideDate).isValid || draft.overrides.some((o) => o.date === overrideDate)}
                                onPress={() => setDraft({ ...draft, overrides: [...draft.overrides, { date: overrideDate, ranges: [] }].sort((a, b) => a.date.localeCompare(b.date)) })}
                            />
                        </View>
                        {draft.overrides.length === 0 ? (
                            <Txt variant="caption" tone="muted">
                                Block a day off or set special hours for a single date.
                            </Txt>
                        ) : null}
                        {draft.overrides.map((o) => (
                            <View key={o.date} style={{ gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: c.border }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                                        {DateTime.fromISO(o.date).toFormat('ccc d LLL yyyy')}
                                    </Txt>
                                    <Pressable accessibilityRole="button" accessibilityLabel="Remove override" onPress={() => setDraft({ ...draft, overrides: draft.overrides.filter((x) => x.date !== o.date) })}>
                                        <Ionicons name="trash-outline" size={18} color={c.danger} />
                                    </Pressable>
                                </View>
                                {o.ranges.length === 0 ? (
                                    <Txt variant="caption" tone="warning">
                                        Unavailable all day
                                    </Txt>
                                ) : null}
                                <RangesEditor ranges={o.ranges} onChange={(r) => setDraft({ ...draft, overrides: draft.overrides.map((x) => (x.date === o.date ? { ...x, ranges: r } : x)) })} />
                            </View>
                        ))}
                    </Card>

                    {error ? (
                        <Txt tone="danger" style={{ marginTop: spacing.md }}>
                            {error}
                        </Txt>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
                        {schedules.length > 1 && schedules.some((s) => s.id === draft.id) ? (
                            <Button title="Delete" variant="danger" icon="trash-outline" onPress={() => deleteSchedule(draft.id).then(() => setSelectedId(schedules.find((s) => s.id !== draft.id)?.id))} />
                        ) : null}
                        <Button title={saved ? 'Saved' : 'Save schedule'} icon={saved ? 'checkmark-done' : 'checkmark'} onPress={save} style={{ flex: 1 }} />
                    </View>
                </>
            ) : (
                <Button title="Create a schedule" onPress={create} style={{ marginTop: spacing.lg }} />
            )}
        </Screen>
    );
}
