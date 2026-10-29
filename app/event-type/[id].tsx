import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { deleteEventType, newId, saveEventType } from '../../src/data/api';
import { eventTypeSchema } from '../../src/engine';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useMe, useWorkspace } from '../../src/hooks/useWorkspace';
import { haptics } from '../../src/lib/haptics';
import { palette, spacing, useTheme } from '../../src/theme';
import type { EventType } from '../../src/types';
import { Screen } from '../../src/ui/Screen';
import { Button, Card, Chip, Field, ListRow, SectionHeader, Txt } from '../../src/ui/primitives';

const COLORS = [palette.violet, palette.cyan, palette.pink, palette.amber, palette.mint, palette.sky, palette.coral];
const LOCATIONS: { kind: EventType['location']['kind']; label: string; placeholder?: string }[] = [
    { kind: 'google_meet', label: 'Google Meet' },
    { kind: 'zoom', label: 'Zoom', placeholder: 'Your Zoom meeting link' },
    { kind: 'phone', label: 'Phone', placeholder: 'Phone number (or leave empty to ask invitee)' },
    { kind: 'in_person', label: 'In person', placeholder: 'Address' },
    { kind: 'custom', label: 'Custom link', placeholder: 'https://…' },
];
const KINDS: { kind: EventType['kind']; label: string; hint: string; team?: boolean }[] = [
    { kind: 'one_on_one', label: '1:1', hint: 'One host, one invitee' },
    { kind: 'group', label: 'Group', hint: 'One host, many seats per slot' },
    { kind: 'round_robin', label: 'Round-robin', hint: 'Rotates between hosts, load-balanced', team: true },
    { kind: 'collective', label: 'Collective', hint: 'Every host must be free', team: true },
];

function Options<T extends number | undefined>({ label, value, options, onChange, format }: { label: string; value: T; options: T[]; onChange: (v: T) => void; format: (v: T) => string }) {
    return (
        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <Txt variant="label" tone="secondary">
                {label}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {options.map((o) => (
                    <Chip key={String(o)} label={format(o)} selected={o === value} onPress={() => onChange(o)} />
                ))}
            </View>
        </View>
    );
}

const mins = (m: number | undefined) => (m === undefined ? 'None' : m === 0 ? '0' : m < 60 ? `${m}m` : m % 1440 === 0 ? `${m / 1440}d` : `${m / 60}h`);

export default function EventTypeEditor() {
    const { c } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const me = useMe();
    const { eventTypes, schedules, team } = useWorkspace();
    const { can } = useSubscription();
    const existing = eventTypes.find((e) => e.id === id);
    const [et, setEt] = useState<EventType>(
        () =>
            existing ?? {
                id: newId(),
                ownerId: me?.id ?? '',
                slug: '',
                title: '',
                kind: 'one_on_one',
                durationMinutes: 30,
                slotIntervalMinutes: 30,
                bufferBeforeMinutes: 0,
                bufferAfterMinutes: 10,
                minimumNoticeMinutes: 240,
                rollingWindowDays: 60,
                location: { kind: 'google_meet' },
                color: COLORS[eventTypes.length % COLORS.length],
                scheduleId: schedules[0]?.id ?? '',
                hostIds: me ? [me.id] : [],
                questions: [],
                active: can('unlimited_event_types') || !eventTypes.some((e) => e.active && e.ownerId === me?.id),
            },
    );
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof EventType>(k: K, v: EventType[K]) => setEt((prev) => ({ ...prev, [k]: v }));
    const location = LOCATIONS.find((l) => l.kind === et.location.kind)!;

    const save = async () => {
        const slug = et.slug || et.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const candidate = { ...et, slug };
        const parsed = eventTypeSchema.safeParse(candidate);
        if (!parsed.success) {
            setError(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)[0] ?? 'Please check the form');
            haptics.warning();
            return;
        }
        if (eventTypes.some((e) => e.slug === slug && e.id !== et.id && e.ownerId === et.ownerId)) {
            setError('You already have an event with this link');
            return;
        }
        setSaving(true);
        try {
            await saveEventType(candidate);
            haptics.success();
            router.back();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen title={existing ? 'Edit event type' : 'New event type'} back="close" maxWidth={760}>
            <View style={{ gap: spacing.md }}>
                <Field label="Title" value={et.title} onChangeText={(t) => set('title', t)} placeholder="Intro call" maxLength={120} />
                <Field label="Link" value={et.slug} onChangeText={(t) => set('slug', t.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="auto from title" autoCapitalize="none" hint={`timesync.app/${me?.username ?? 'you'}/${et.slug || 'your-event'}`} />
                <Field label="Description" value={et.description ?? ''} onChangeText={(t) => set('description', t)} multiline maxLength={2000} />
            </View>

            <SectionHeader title="Type" />
            <View style={{ gap: spacing.sm }}>
                {KINDS.map((k) => {
                    const locked = k.team && !can('round_robin');
                    return (
                        <Card
                            key={k.kind}
                            onPress={() => (locked ? router.push({ pathname: '/paywall', params: { feature: 'round_robin' } }) : set('kind', k.kind))}
                            accent={et.kind === k.kind ? c.primary : undefined}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderColor: et.kind === k.kind ? c.primary : c.border }}
                        >
                            <View style={{ flex: 1 }}>
                                <Txt variant="bodyStrong">{k.label}</Txt>
                                <Txt variant="caption" tone="muted">
                                    {k.hint}
                                </Txt>
                            </View>
                            {locked ? <Ionicons name="lock-closed" size={16} color={c.textMuted} /> : et.kind === k.kind ? <Ionicons name="checkmark-circle" size={20} color={c.primary} /> : null}
                        </Card>
                    );
                })}
            </View>
            {et.kind === 'group' ? <Options label="Seats per slot" value={et.seats ?? 10} options={[3, 5, 10, 20, 50]} onChange={(v) => set('seats', v)} format={(v) => `${v}`} /> : null}
            {et.kind === 'round_robin' || et.kind === 'collective' ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                    <Txt variant="label" tone="secondary">
                        Hosts
                    </Txt>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                        {[...(me ? [me] : []), ...team].map((p) => (
                            <Chip key={p.id} label={p.id === me?.id ? 'You' : p.name.split(' ')[0]} selected={et.hostIds.includes(p.id)} onPress={() => set('hostIds', et.hostIds.includes(p.id) ? et.hostIds.filter((h) => h !== p.id) : [...et.hostIds, p.id])} />
                        ))}
                    </View>
                </View>
            ) : null}

            <SectionHeader title="When" />
            <Options label="Duration" value={et.durationMinutes} options={[15, 20, 30, 45, 60, 90, 120]} onChange={(v) => set('durationMinutes', v)} format={(v) => `${v} min`} />
            <Options label="Start times every" value={et.slotIntervalMinutes} options={[15, 30, 60, undefined]} onChange={(v) => set('slotIntervalMinutes', v)} format={(v) => (v === undefined ? 'Duration' : `${v} min`)} />
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
                <Txt variant="label" tone="secondary">
                    Availability schedule
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {schedules.map((s) => (
                        <Chip key={s.id} label={s.name} selected={et.scheduleId === s.id} onPress={() => set('scheduleId', s.id)} />
                    ))}
                    <Chip label="Edit schedules" icon="create-outline" onPress={() => router.push('/availability')} />
                </View>
            </View>
            <Options label="Buffer before" value={et.bufferBeforeMinutes} options={[0, 5, 10, 15, 30]} onChange={(v) => set('bufferBeforeMinutes', v)} format={mins} />
            <Options label="Buffer after" value={et.bufferAfterMinutes} options={[0, 5, 10, 15, 30]} onChange={(v) => set('bufferAfterMinutes', v)} format={mins} />
            <Options label="Minimum notice" value={et.minimumNoticeMinutes} options={[0, 60, 240, 1440, 2880]} onChange={(v) => set('minimumNoticeMinutes', v)} format={mins} />
            <Options label="Max per day" value={et.maxPerDay} options={[undefined, 2, 4, 6, 8]} onChange={(v) => set('maxPerDay', v)} format={(v) => (v === undefined ? 'No limit' : `${v}`)} />
            <Options label="Bookable up to" value={et.rollingWindowDays} options={[14, 30, 60, 90]} onChange={(v) => set('rollingWindowDays', v)} format={(v) => `${v} days ahead`} />

            <SectionHeader title="Where" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
                {LOCATIONS.map((l) => (
                    <Chip key={l.kind} label={l.label} selected={et.location.kind === l.kind} onPress={() => set('location', { kind: l.kind })} />
                ))}
            </View>
            {location.placeholder ? <Field label={location.label} value={et.location.value ?? ''} onChangeText={(v) => set('location', { kind: et.location.kind, value: v })} placeholder={location.placeholder} autoCapitalize="none" /> : (
                <Txt variant="caption" tone="muted">
                    A unique Meet link is created automatically when Google Calendar is connected.
                </Txt>
            )}

            <SectionHeader title="Intake questions" action="Add" onAction={() => set('questions', [...et.questions, { id: `q-${Date.now().toString(36)}`, label: '', type: 'text', required: false }])} />
            {et.questions.length === 0 ? (
                <Txt variant="caption" tone="muted">
                    Name and email are always asked. Add questions to prepare for the meeting.
                </Txt>
            ) : null}
            {et.questions.map((q, i) => (
                <Card key={q.id} style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
                    <Field label={`Question ${i + 1}`} value={q.label} onChangeText={(t) => set('questions', et.questions.map((x) => (x.id === q.id ? { ...x, label: t } : x)))} maxLength={200} />
                    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(['text', 'textarea', 'phone'] as const).map((t) => (
                            <Chip key={t} label={t} selected={q.type === t} onPress={() => set('questions', et.questions.map((x) => (x.id === q.id ? { ...x, type: t } : x)))} />
                        ))}
                        <Chip label={q.required ? 'Required' : 'Optional'} selected={q.required} onPress={() => set('questions', et.questions.map((x) => (x.id === q.id ? { ...x, required: !x.required } : x)))} />
                        <Pressable accessibilityRole="button" accessibilityLabel="Remove question" onPress={() => set('questions', et.questions.filter((x) => x.id !== q.id))} style={{ marginLeft: 'auto' }}>
                            <Ionicons name="trash-outline" size={20} color={c.danger} />
                        </Pressable>
                    </View>
                </Card>
            ))}

            <SectionHeader title="Style" />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {COLORS.map((col) => (
                    <Pressable key={col} accessibilityRole="radio" accessibilityLabel={`Colour ${col}`} accessibilityState={{ selected: et.color === col }} onPress={() => set('color', col)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: col, borderWidth: 3, borderColor: et.color === col ? c.text : 'transparent' }} />
                ))}
            </View>
            <Card style={{ paddingVertical: 0, marginTop: spacing.lg }}>
                <ListRow icon="eye-outline" title="Active" subtitle="Invitees can book this event" toggle={et.active} onToggle={(v) => (v && !can('unlimited_event_types') && eventTypes.some((e) => e.active && e.id !== et.id && e.ownerId === me?.id) ? router.push('/paywall') : set('active', v))} last />
            </Card>

            {error ? (
                <Txt tone="danger" style={{ marginTop: spacing.md }}>
                    {error}
                </Txt>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
                {existing ? (
                    <Button
                        title="Delete"
                        variant="danger"
                        icon="trash-outline"
                        onPress={async () => {
                            await deleteEventType(et.id);
                            router.back();
                        }}
                    />
                ) : null}
                <Button title="Save" icon="checkmark" onPress={save} loading={saving} style={{ flex: 1 }} />
            </View>
        </Screen>
    );
}
