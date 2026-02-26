import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { GradientBackground } from '../src/components/atoms/GradientBackground';
import { HolographicCard } from '../src/components/atoms/HolographicCard';
import { culturalHolidays } from '../src/constants/mockData';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';

const filters = ['All', 'Religious', 'Cultural', 'Major', 'Minor'];

export default function CulturalCalendarScreen() {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredHolidays = culturalHolidays.filter((h) => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Religious') return h.religion && h.religion !== 'Cultural';
        if (activeFilter === 'Cultural') return h.religion === 'Cultural';
        if (activeFilter === 'Major') return h.observanceLevel === 'major';
        if (activeFilter === 'Minor') return h.observanceLevel === 'minor';
        return true;
    });

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <Text style={styles.backButton}>← Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Cultural Calendar</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    <Text style={styles.subtitle}>{culturalHolidays.length} holidays from around the world</Text>

                    {/* Filters */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                        {filters.map((f) => (
                            <Pressable key={f} onPress={() => setActiveFilter(f)}>
                                <View style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}>
                                    <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Holidays List */}
                    {filteredHolidays.map((holiday) => (
                        <HolographicCard key={holiday.id} style={styles.holidayCard}>
                            <View style={styles.holidayHeader}>
                                <Text style={styles.holidayEmoji}>{holiday.emoji || '📅'}</Text>
                                <View style={styles.holidayInfo}>
                                    <Text style={styles.holidayName}>{holiday.name}</Text>
                                    <Text style={styles.holidayDate}>
                                        {new Date(holiday.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                </View>
                                <View style={[styles.levelBadge, holiday.observanceLevel === 'major' ? styles.majorBadge : styles.minorBadge]}>
                                    <Text style={styles.levelText}>{holiday.observanceLevel}</Text>
                                </View>
                            </View>
                            <Text style={styles.holidayCountry}>{holiday.country}</Text>
                            {holiday.religion && (
                                <Text style={styles.holidayReligion}>{holiday.religion}</Text>
                            )}
                            <Text style={styles.holidayDescription}>{holiday.description}</Text>
                        </HolographicCard>
                    ))}

                    <View style={{ height: spacing.huge }} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    backButton: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: colors.primary.light },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    subtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
    filtersRow: { gap: spacing.sm, paddingBottom: spacing.lg },
    filterChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.glass.border, backgroundColor: colors.dark.card },
    filterChipActive: { borderColor: colors.primary.main, backgroundColor: colors.primary.main + '20' },
    filterText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    filterTextActive: { color: colors.primary.light },
    holidayCard: { marginBottom: spacing.md },
    holidayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
    holidayEmoji: { fontSize: 28 },
    holidayInfo: { flex: 1 },
    holidayName: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: '#FFF' },
    holidayDate: { fontFamily: fontFamilies.mono, fontSize: fontSizes.sm, color: colors.primary.light },
    levelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
    majorBadge: { backgroundColor: colors.accent.yellow + '20' },
    minorBadge: { backgroundColor: colors.glass.white },
    levelText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.xs, color: colors.glass.text, textTransform: 'capitalize' },
    holidayCountry: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.secondary.main, marginBottom: 4 },
    holidayReligion: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.xs, color: colors.accent.pink, marginBottom: spacing.xs },
    holidayDescription: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, lineHeight: 20 },
});
