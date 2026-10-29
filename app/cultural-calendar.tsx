import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FeatureGate } from '../src/components/Monetization';
import { holidaysBetween, workweekLabel, type HolidayKind } from '../src/engine';
import { usePeople } from '../src/hooks/useWorkspace';
import { spacing } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Badge, Card, Chip, EmptyState, SectionHeader, Txt } from '../src/ui/primitives';

const FILTERS: { key: 'all' | 'team' | HolidayKind; label: string }[] = [
    { key: 'team', label: 'My team' },
    { key: 'all', label: 'Worldwide' },
    { key: 'public', label: 'Public' },
    { key: 'religious', label: 'Religious' },
    { key: 'cultural', label: 'Cultural' },
];

export default function CulturalCalendar() {
    const { all } = usePeople();
    const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('team');
    const countries = useMemo(() => [...new Set(all.map((p) => p.countryCode).filter((c): c is string => !!c))], [all]);
    const today = DateTime.now();
    const holidays = useMemo(() => {
        const list = holidaysBetween(today.toISODate()!, today.plus({ days: 180 }).toISODate()!, filter === 'team' ? countries : undefined);
        return filter === 'team' || filter === 'all' ? list : list.filter((h) => h.kind === filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, countries]);

    return (
        <Screen title="Cultural calendar" subtitle="Holidays, observances and regional workweeks" back maxWidth={820}>
            <FeatureGate feature="cultural_calendar">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}>
                    {FILTERS.map((f) => (
                        <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
                    ))}
                </ScrollView>

                <SectionHeader title="Workweeks" style={{ marginTop: 0 }} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {countries.map((cc) => (
                        <Badge key={cc} tone={workweekLabel(cc) === 'Mon–Fri' ? 'neutral' : 'accent'} label={`${cc} · ${workweekLabel(cc)}`} />
                    ))}
                </View>
                <Txt variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                    The optimizer treats each person’s regional weekend and public holidays as off-days.
                </Txt>

                <SectionHeader title="Next 6 months" />
                {holidays.length === 0 ? <EmptyState icon="calendar-outline" title="Nothing coming up" /> : null}
                {holidays.map((h) => (
                    <Card key={h.id} style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, alignItems: 'center' }}>
                        <Txt style={{ fontSize: 28 }}>{h.emoji}</Txt>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Txt variant="bodyStrong">{h.name}</Txt>
                            <Txt variant="mono" tone="secondary">
                                {DateTime.fromISO(h.date).toFormat('ccc d LLL yyyy')}
                            </Txt>
                            <Txt variant="caption" tone="muted" numberOfLines={2}>
                                {h.description} {h.countries.includes('*') ? 'Worldwide.' : h.countries.join(', ')}
                            </Txt>
                        </View>
                        <View style={{ gap: 4, alignItems: 'flex-end' }}>
                            <Badge tone={h.level === 'major' ? 'warning' : 'neutral'} label={h.level} />
                            {h.approximate ? <Badge label="date may vary" /> : null}
                        </View>
                    </Card>
                ))}
            </FeatureGate>
        </Screen>
    );
}
