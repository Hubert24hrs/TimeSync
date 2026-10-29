import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import React from 'react';
import { Pressable, View } from 'react-native';
import { cityFromZone, isDst, localHour, nextDstTransition, utcOffsetLabel, workweekLabel } from '../engine';
import { useNow } from '../hooks/useNow';
import { useHour12 } from '../hooks/useWorkspace';
import { radius, spacing, type, useTheme } from '../theme';
import { Badge, Card, Txt } from '../ui/primitives';

/** Live, DST-aware clock for a zone, with day/night, offset and the next DST change. */
export function TimeZoneCard({ timezone, label, people, countryCode, compact }: { timezone: string; label?: string; people?: string[]; countryCode?: string; compact?: boolean }) {
    const { c } = useTheme();
    const now = useNow(1000);
    const hour12 = useHour12();
    const dt = DateTime.fromMillis(now, { zone: timezone });
    const h = localHour(now, timezone);
    const isDay = h >= 7 && h < 19;
    const working = h >= 9 && h < 17;
    const dst = nextDstTransition(timezone, now, 30);
    return (
        <Card style={{ minWidth: compact ? 150 : 200, gap: 6 }} accent={working ? c.success : isDay ? c.warning : c.primary}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Ionicons name={isDay ? 'sunny' : 'moon'} size={14} color={isDay ? c.warning : c.primary} />
                    <Txt variant="label" tone="secondary" numberOfLines={1}>
                        {label ?? cityFromZone(timezone)}
                    </Txt>
                </View>
                <Txt variant="mono" tone="muted">
                    {utcOffsetLabel(timezone, now)}
                </Txt>
            </View>
            <Txt accessibilityLabel={`${dt.toFormat('h:mm a')} in ${cityFromZone(timezone)}`} style={[type.clock, { color: c.text }]}>
                {dt.toFormat(hour12 ? 'h:mm' : 'HH:mm')}
                {hour12 ? <Txt variant="mono" tone="muted">{` ${dt.toFormat('a')}`}</Txt> : null}
            </Txt>
            <Txt variant="caption" tone="muted">
                {dt.toFormat('ccc d LLL')} · {working ? 'Working hours' : isDay ? 'Off hours' : 'Night'}
                {countryCode ? ` · ${workweekLabel(countryCode)}` : ''}
            </Txt>
            {!compact && dst ? <Badge tone="warning" icon="time-outline" label={`DST ${dst.offsetChangeMinutes > 0 ? '+' : '−'}1h ${DateTime.fromMillis(dst.at, { zone: timezone }).toFormat('d LLL')}`} /> : null}
            {!compact && isDst(timezone, now) ? <Badge tone="info" label="Daylight time" /> : null}
            {people?.length ? (
                <Txt variant="caption" tone="secondary" numberOfLines={1}>
                    {people.join(', ')}
                </Txt>
            ) : null}
        </Card>
    );
}

/** 24-hour overlap bar: how many people are in working hours at each hour of the viewer's day. */
export function OverlapHeatmap({ data, nowHour, onPressHour }: { data: { hour: number; available: number; total: number }[]; nowHour?: number; onPressHour?: (hour: number) => void }) {
    const { c } = useTheme();
    const best = Math.max(1, ...data.map((d) => d.available));
    return (
        <View>
            <View style={{ flexDirection: 'row', gap: 2, height: 56, alignItems: 'flex-end' }} accessibilityLabel="Team overlap by hour">
                {data.map((d) => {
                    const ratio = d.total ? d.available / d.total : 0;
                    return (
                        <Pressable
                            key={d.hour}
                            disabled={!onPressHour}
                            onPress={() => onPressHour?.(d.hour)}
                            accessibilityLabel={`${d.hour}:00, ${d.available} of ${d.total} available`}
                            style={{
                                flex: 1,
                                height: 8 + (d.available / best) * 48,
                                borderRadius: radius.sm / 2,
                                backgroundColor: ratio >= 0.75 ? c.success : ratio >= 0.4 ? c.warning : ratio > 0 ? c.danger : c.border,
                                opacity: nowHour === d.hour ? 1 : 0.8,
                                borderWidth: nowHour === d.hour ? 2 : 0,
                                borderColor: c.text,
                            }}
                        />
                    );
                })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                {[0, 6, 12, 18, 23].map((h) => (
                    <Txt key={h} variant="caption" tone="muted">
                        {String(h).padStart(2, '0')}:00
                    </Txt>
                ))}
            </View>
        </View>
    );
}
