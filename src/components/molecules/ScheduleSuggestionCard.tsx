import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassButton } from '../atoms/GlassButton';
import { ScheduleSuggestion } from '../../types';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface ScheduleSuggestionCardProps {
    suggestion: ScheduleSuggestion;
    onAccept?: () => void;
    onReject?: () => void;
}

function formatSuggestionTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatSuggestionDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ScheduleSuggestionCard({ suggestion, onAccept, onReject }: ScheduleSuggestionCardProps) {
    return (
        <LinearGradient
            colors={[colors.dark.card, colors.dark.elevated]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, shadows.card]}
        >
            <View style={styles.header}>
                <Text style={styles.date}>{formatSuggestionDate(suggestion.startTime)}</Text>
                <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{Math.round(suggestion.confidence * 100)}% match</Text>
                </View>
            </View>

            <Text style={styles.time}>
                {formatSuggestionTime(suggestion.startTime)} — {formatSuggestionTime(suggestion.endTime)}
            </Text>

            <View style={styles.scores}>
                <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Fairness</Text>
                    <View style={styles.scoreBar}>
                        <LinearGradient
                            colors={[colors.secondary.main, colors.secondary.light]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.scoreBarFill, { width: `${suggestion.fairnessScore}%` }]}
                        />
                    </View>
                    <Text style={styles.scoreValue}>{suggestion.fairnessScore}</Text>
                </View>
                <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Energy</Text>
                    <View style={styles.scoreBar}>
                        <LinearGradient
                            colors={[colors.primary.main, colors.primary.light]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.scoreBarFill, { width: `${suggestion.energyScore}%` }]}
                        />
                    </View>
                    <Text style={styles.scoreValue}>{suggestion.energyScore}</Text>
                </View>
            </View>

            <View style={styles.prosConsRow}>
                <View style={styles.prosCol}>
                    {suggestion.pros.slice(0, 2).map((pro, i) => (
                        <Text key={i} style={styles.proText}>✓ {pro}</Text>
                    ))}
                </View>
                <View style={styles.consCol}>
                    {suggestion.cons.slice(0, 2).map((con, i) => (
                        <Text key={i} style={styles.conText}>✗ {con}</Text>
                    ))}
                </View>
            </View>

            <View style={styles.actions}>
                <GlassButton title="Decline" onPress={onReject || (() => { })} variant="ghost" size="sm" />
                <GlassButton title="Accept" onPress={onAccept || (() => { })} variant="primary" size="sm" />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glass.border, padding: spacing.lg, marginBottom: spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    date: { color: colors.glass.textMuted, fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm },
    confidenceBadge: { backgroundColor: colors.primary.main + '20', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    confidenceText: { color: colors.primary.light, fontFamily: fontFamilies.mono, fontSize: fontSizes.xs },
    time: { color: '#FFF', fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xl, marginBottom: spacing.md },
    scores: { gap: spacing.sm, marginBottom: spacing.md },
    scoreItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    scoreLabel: { color: colors.glass.textMuted, fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, width: 55 },
    scoreBar: { flex: 1, height: 6, backgroundColor: colors.dark.surface, borderRadius: 3, overflow: 'hidden' },
    scoreBarFill: { height: '100%', borderRadius: 3 },
    scoreValue: { color: colors.glass.text, fontFamily: fontFamilies.mono, fontSize: fontSizes.xs, width: 28, textAlign: 'right' },
    prosConsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    prosCol: { flex: 1, gap: 4 },
    consCol: { flex: 1, gap: 4 },
    proText: { color: colors.status.success, fontFamily: fontFamilies.primary, fontSize: fontSizes.xs },
    conText: { color: colors.status.warning, fontFamily: fontFamilies.primary, fontSize: fontSizes.xs },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
