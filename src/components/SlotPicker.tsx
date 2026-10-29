import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { PublicEventPage, PublicSlot } from '../data/api';
import { radius, scoreColor, spacing, useTheme } from '../theme';
import { Chip, EmptyState, PressScale, Skeleton, Txt } from '../ui/primitives';

/** Day chips + time grid in the invitee's zone, with fairness / energy dots per slot. */
export function SlotPicker({ page, loading, selected, onSelect }: { page?: PublicEventPage; loading: boolean; selected?: string; onSelect: (slot: PublicSlot) => void }) {
    const { c } = useTheme();
    const [day, setDay] = useState<string | undefined>();
    useEffect(() => {
        if (page && (!day || !page.days.some((d) => d.date === day))) setDay(page.days[0]?.date);
    }, [page, day]);

    if (loading || !page) {
        return (
            <View style={{ gap: spacing.md }}>
                <Skeleton height={36} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} height={44} width={104} />
                    ))}
                </View>
            </View>
        );
    }
    if (page.days.length === 0) return <EmptyState icon="calendar-clear-outline" title="No times available" body="Try again later or contact the host." />;
    const current = page.days.find((d) => d.date === day) ?? page.days[0];

    return (
        <View style={{ gap: spacing.md }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {page.days.map((d) => (
                    <Chip key={d.date} label={d.label} selected={d.date === current.date} onPress={() => setDay(d.date)} />
                ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {current.slots.map((s) => {
                    const active = s.start === selected;
                    return (
                        <PressScale key={s.start} onPress={() => onSelect(s)} accessibilityLabel={`${s.label}${s.fairness !== undefined ? `, fairness ${s.fairness}` : ''}`}>
                            <View style={{ minWidth: 112, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primarySoft : c.card, gap: 4 }}>
                                <Txt variant="bodyStrong" tone={active ? 'primary' : 'default'}>
                                    {s.label}
                                </Txt>
                                {s.fairness !== undefined ? (
                                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                        <Ionicons name="scale-outline" size={11} color={scoreColor(s.fairness, c)} />
                                        <Txt variant="caption" style={{ color: scoreColor(s.fairness, c) }}>
                                            {s.fairness}
                                        </Txt>
                                        {s.energy !== undefined ? (
                                            <>
                                                <Ionicons name="flash-outline" size={11} color={scoreColor(s.energy, c)} />
                                                <Txt variant="caption" style={{ color: scoreColor(s.energy, c) }}>
                                                    {s.energy}
                                                </Txt>
                                            </>
                                        ) : null}
                                    </View>
                                ) : null}
                                {s.seatsLeft !== undefined ? (
                                    <Txt variant="caption" tone="muted">
                                        {s.seatsLeft} seats left
                                    </Txt>
                                ) : null}
                            </View>
                        </PressScale>
                    );
                })}
            </View>
            <Txt variant="caption" tone="muted">
                ⚖ fairness for everyone’s local hours · ⚡ energy at that time. Times shown in {page.timezone.replace(/_/g, ' ')}.
            </Txt>
        </View>
    );
}
