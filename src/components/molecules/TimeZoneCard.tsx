import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { HolographicCard } from '../atoms/HolographicCard';
import { PulseIndicator } from '../atoms/PulseIndicator';
import { useLiveClock } from '../../hooks/useLiveClock';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface TimeZoneCardProps {
    timezone: string;
    memberName?: string;
    cityLabel?: string;
    onPress?: () => void;
}

function getTimezoneLabel(tz: string): string {
    const parts = tz.split('/');
    return (parts[parts.length - 1] || tz).replace(/_/g, ' ');
}

function getUTCOffset(tz: string): string {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
        const parts = formatter.formatToParts(now);
        const offsetPart = parts.find((p) => p.type === 'timeZoneName');
        return offsetPart?.value || 'UTC';
    } catch {
        return 'UTC';
    }
}

function isDayTime(tz: string): boolean {
    try {
        const hour = parseInt(
            new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }),
            10
        );
        return hour >= 6 && hour < 20;
    } catch {
        return true;
    }
}

export function TimeZoneCard({ timezone, memberName, cityLabel, onPress }: TimeZoneCardProps) {
    const time = useLiveClock(timezone);
    const city = cityLabel || getTimezoneLabel(timezone);
    const offset = getUTCOffset(timezone);
    const isDay = isDayTime(timezone);

    return (
        <HolographicCard
            onPress={onPress}
            glowColor={isDay ? colors.accent.yellow : colors.primary.main}
            style={styles.card}
        >
            <View style={styles.header}>
                <Text style={styles.dayNight}>{isDay ? '☀️' : '🌙'}</Text>
                <Text style={styles.offset}>{offset}</Text>
            </View>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.city}>{city}</Text>
            {memberName && (
                <View style={styles.memberRow}>
                    <PulseIndicator status="online" size={6} />
                    <Text style={styles.memberName}>{memberName}</Text>
                </View>
            )}
        </HolographicCard>
    );
}

const styles = StyleSheet.create({
    card: { minWidth: 160, padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    dayNight: { fontSize: 20 },
    offset: { color: colors.glass.textMuted, fontFamily: fontFamilies.mono, fontSize: fontSizes.xs },
    time: { color: '#FFF', fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xxxl, letterSpacing: 1, marginBottom: spacing.xs },
    city: { color: colors.glass.text, fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.md, marginBottom: spacing.sm },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    memberName: { color: colors.glass.textMuted, fontFamily: fontFamilies.primary, fontSize: fontSizes.sm },
});
