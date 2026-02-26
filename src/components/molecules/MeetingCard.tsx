import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarEvent } from '../../types';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface MeetingCardProps {
    event: CalendarEvent;
    onPress?: () => void;
}

function formatTime(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getEnergyCostColor(cost: number): string {
    if (cost <= 3) return colors.energy.high;
    if (cost <= 6) return colors.energy.medium;
    return colors.energy.low;
}

export function MeetingCard({ event, onPress }: MeetingCardProps) {
    const startTime = formatTime(event.startTime);
    const endTime = formatTime(event.endTime);
    const statusColor = event.color || colors.primary.main;

    return (
        <Pressable onPress={onPress}>
            <LinearGradient
                colors={[colors.dark.card, colors.dark.elevated]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, shadows.card]}
            >
                <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
                        <View style={[styles.energyBadge, { backgroundColor: getEnergyCostColor(event.energyCost) + '20' }]}>
                            <Text style={[styles.energyText, { color: getEnergyCostColor(event.energyCost) }]}>⚡{event.energyCost}</Text>
                        </View>
                    </View>
                    <Text style={styles.time}>{startTime} — {endTime}</Text>
                    {event.description && (
                        <Text style={styles.description} numberOfLines={1}>{event.description}</Text>
                    )}
                    <View style={styles.footer}>
                        <View style={styles.attendees}>
                            {event.attendees.slice(0, 3).map((a, i) => (
                                <View key={a.id} style={[styles.avatarCircle, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i, backgroundColor: getColorForIndex(i) }]}>
                                    <Text style={styles.avatarText}>{a.name.charAt(0)}</Text>
                                </View>
                            ))}
                            {event.attendees.length > 3 && (
                                <View style={[styles.avatarCircle, { marginLeft: -8, backgroundColor: colors.dark.surface }]}>
                                    <Text style={styles.avatarText}>+{event.attendees.length - 3}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.statusText}>{event.status}</Text>
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

function getColorForIndex(i: number): string {
    const palette = [colors.primary.main, colors.secondary.main, colors.accent.pink, colors.accent.yellow];
    return palette[i % palette.length];
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.glass.border,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    statusStrip: { width: 4, borderTopLeftRadius: borderRadius.lg, borderBottomLeftRadius: borderRadius.lg },
    content: { flex: 1, padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    title: { color: '#FFF', fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.lg, flex: 1 },
    energyBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginLeft: spacing.sm },
    energyText: { fontFamily: fontFamilies.mono, fontSize: fontSizes.xs },
    time: { color: colors.glass.textMuted, fontFamily: fontFamilies.mono, fontSize: fontSizes.sm, marginBottom: spacing.xs },
    description: { color: colors.glass.textMuted, fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, marginBottom: spacing.sm },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    attendees: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.dark.card },
    avatarText: { color: '#FFF', fontFamily: fontFamilies.primarySemiBold, fontSize: 10 },
    statusText: { color: colors.glass.textMuted, fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, textTransform: 'capitalize' },
});
