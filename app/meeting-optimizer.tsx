import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { GradientBackground } from '../src/components/atoms/GradientBackground';
import { HolographicCard } from '../src/components/atoms/HolographicCard';
import { GlassButton } from '../src/components/atoms/GlassButton';
import { ScheduleSuggestionCard } from '../src/components/molecules/ScheduleSuggestionCard';
import { scheduleSuggestions, calendarEvents } from '../src/constants/mockData';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { FeatureGate } from '../src/components/atoms/FeatureGate';

export default function MeetingOptimizerScreen() {
    const conflictEvents = calendarEvents.slice(0, 2);

    return (
        <FeatureGate feature="meeting_optimizer">
            <GradientBackground>
                <SafeAreaView style={styles.container} edges={['top']}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Pressable onPress={() => router.back()} hitSlop={12}>
                                <Text style={styles.backButton}>← Back</Text>
                            </Pressable>
                            <Text style={styles.title}>Meeting Optimizer</Text>
                            <View style={{ width: 60 }} />
                        </View>

                        {/* Conflict Alert */}
                        <HolographicCard glowColor={colors.status.warning} style={styles.conflictCard}>
                            <View style={styles.conflictHeader}>
                                <Text style={styles.conflictEmoji}>⚠️</Text>
                                <Text style={styles.conflictTitle}>Scheduling Conflict Detected</Text>
                            </View>
                            <Text style={styles.conflictDesc}>
                                "{conflictEvents[0]?.title}" and "{conflictEvents[1]?.title}" have overlapping time slots
                            </Text>
                            <View style={styles.conflictEvents}>
                                {conflictEvents.map((evt) => (
                                    <View key={evt.id} style={styles.conflictEvent}>
                                        <View style={[styles.conflictDot, { backgroundColor: evt.color || colors.primary.main }]} />
                                        <View>
                                            <Text style={styles.conflictEventTitle}>{evt.title}</Text>
                                            <Text style={styles.conflictEventTime}>
                                                {new Date(evt.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(evt.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </HolographicCard>

                        {/* AI Suggestions */}
                        <Text style={styles.sectionTitle}>AI-Ranked Alternatives</Text>
                        <Text style={styles.sectionSubtitle}>Optimized for fairness, energy, and timezone balance</Text>

                        {scheduleSuggestions.map((sug, i) => (
                            <View key={sug.id}>
                                {i === 0 && (
                                    <View style={styles.bestBadge}>
                                        <Text style={styles.bestBadgeText}>🏆 Best Match</Text>
                                    </View>
                                )}
                                <ScheduleSuggestionCard
                                    suggestion={sug}
                                    onAccept={() => { }}
                                    onReject={() => { }}
                                />
                            </View>
                        ))}

                        {/* Fairness Metrics */}
                        <Text style={styles.sectionTitle}>Fairness Analytics</Text>
                        <HolographicCard glowColor={colors.secondary.main}>
                            <View style={styles.metricsGrid}>
                                <View style={styles.metric}>
                                    <Text style={styles.metricValue}>92%</Text>
                                    <Text style={styles.metricLabel}>Timezone Fairness</Text>
                                </View>
                                <View style={styles.metric}>
                                    <Text style={styles.metricValue}>87%</Text>
                                    <Text style={styles.metricLabel}>Energy Alignment</Text>
                                </View>
                                <View style={styles.metric}>
                                    <Text style={styles.metricValue}>3/8</Text>
                                    <Text style={styles.metricLabel}>Off-hours Members</Text>
                                </View>
                                <View style={styles.metric}>
                                    <Text style={styles.metricValue}>Low</Text>
                                    <Text style={styles.metricLabel}>Cultural Conflict</Text>
                                </View>
                            </View>
                        </HolographicCard>

                        <View style={styles.ctaContainer}>
                            <GlassButton
                                title="Apply Optimal Time ✨"
                                onPress={() => router.back()}
                                variant="primary"
                                size="lg"
                                fullWidth
                            />
                        </View>

                        <View style={{ height: spacing.huge }} />
                    </ScrollView>
                </SafeAreaView>
            </GradientBackground>
        </FeatureGate>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    backButton: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: colors.primary.light },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    conflictCard: { marginBottom: spacing.xl },
    conflictHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    conflictEmoji: { fontSize: 22 },
    conflictTitle: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: colors.status.warning },
    conflictDesc: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.text, marginBottom: spacing.md, lineHeight: 22 },
    conflictEvents: { gap: spacing.md },
    conflictEvent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    conflictDot: { width: 10, height: 10, borderRadius: 5 },
    conflictEventTitle: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: '#FFF' },
    conflictEventTime: { fontFamily: fontFamilies.mono, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xl, color: '#FFF', marginBottom: spacing.xs },
    sectionSubtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, marginBottom: spacing.lg },
    bestBadge: { backgroundColor: colors.accent.yellow + '20', alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.pill, marginBottom: spacing.sm },
    bestBadgeText: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.sm, color: colors.accent.yellow },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
    metric: { width: '45%' },
    metricValue: { fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xxl, color: '#FFF' },
    metricLabel: { fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    ctaContainer: { marginTop: spacing.xl },
});
