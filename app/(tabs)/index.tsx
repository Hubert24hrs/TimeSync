import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../src/store/store';
import { dismissNotification } from '../../src/store/slices/notificationSlice';
import { BreathingGradient } from '../../src/components/atoms/BreathingGradient';
import { HolographicCard } from '../../src/components/atoms/HolographicCard';
import { AnimatedText } from '../../src/components/atoms/AnimatedText';
import { GlassButton } from '../../src/components/atoms/GlassButton';
import { FloatingParticles } from '../../src/components/atoms/FloatingParticles';
import { GlowingOrb } from '../../src/components/atoms/GlowingOrb';
import { EnergyMeter } from '../../src/components/molecules/EnergyMeter';
import { MeetingCard } from '../../src/components/molecules/MeetingCard';
import { ScheduleSuggestionCard } from '../../src/components/molecules/ScheduleSuggestionCard';
import { FloatingActionButton } from '../../src/components/molecules/FloatingActionButton';
import { SmartNotificationCard } from '../../src/components/molecules/SmartNotificationCard';
import { AdBanner } from '../../src/components/atoms/AdBanner';
import { useCurrentDate } from '../../src/hooks/useLiveClock';
import { useAnimatedEntry } from '../../src/hooks/useAnimatedEntry';
import { calendarEvents, scheduleSuggestions, currentUser } from '../../src/constants/mockData';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const energy = useSelector((state: RootState) => state.energy);
    const notifications = useSelector((state: RootState) => state.notifications);
    const { dayName, monthDay } = useCurrentDate();

    const displayName = user?.name?.split(' ')[0] || currentUser.name.split(' ')[0];
    const todayEvents = calendarEvents.slice(0, 4);
    const topSuggestions = scheduleSuggestions.slice(0, 3);
    const activeNotifications = notifications.items.filter((n) => !n.read).slice(0, 2);

    const entry0 = useAnimatedEntry(0);
    const entry1 = useAnimatedEntry(1);
    const entry2 = useAnimatedEntry(2);
    const entry3 = useAnimatedEntry(3);
    const entry4 = useAnimatedEntry(4);

    const fabActions = [
        {
            id: 'focus',
            icon: '🧠',
            label: 'Focus Mode',
            color: colors.primary.main,
            onPress: () => router.push('/focus-mode'),
        },
        {
            id: 'ai-chat',
            icon: '🤖',
            label: 'AI Schedule',
            color: colors.secondary.main,
            onPress: () => router.push('/(tabs)/schedule'),
        },
        {
            id: 'meeting',
            icon: '📅',
            label: 'Optimize',
            color: colors.accent.yellow,
            onPress: () => router.push('/meeting-optimizer'),
        },
    ];

    return (
        <BreathingGradient>
            {/* Floating background particles */}
            <FloatingParticles count={6} />

            {/* Ambient glow orbs */}
            <GlowingOrb
                color={colors.primary.main}
                size={250}
                intensity={0.08}
                style={{ top: 60, right: -80 }}
            />
            <GlowingOrb
                color={colors.secondary.main}
                size={180}
                intensity={0.06}
                style={{ top: 400, left: -60 }}
            />

            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Animated.View style={[styles.header, entry0]}>
                        <View>
                            <Text style={styles.greeting}>Good Evening,</Text>
                            <Text style={styles.userName}>{displayName} 👋</Text>
                        </View>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dayName}>{dayName}</Text>
                            <Text style={styles.dateText}>{monthDay}</Text>
                            {notifications.unreadCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>{notifications.unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Smart Notifications */}
                    {activeNotifications.length > 0 && (
                        <Animated.View style={entry1}>
                            {activeNotifications.map((notif, i) => (
                                <SmartNotificationCard
                                    key={notif.id}
                                    notification={{
                                        ...notif,
                                        onAction: notif.actionLabel
                                            ? () => router.push('/focus-mode')
                                            : undefined,
                                    }}
                                    index={i}
                                    onDismiss={() => dispatch(dismissNotification(notif.id))}
                                />
                            ))}
                        </Animated.View>
                    )}

                    {/* Energy Forecast Card */}
                    <Animated.View style={entry2}>
                        <HolographicCard glowColor={colors.energy.peak} style={styles.energyCard}>
                            <View style={styles.energyRow}>
                                <View style={styles.energyInfo}>
                                    <Text style={styles.sectionLabel}>Today's Energy</Text>
                                    <Text style={styles.energyHint}>Your predicted peak is at 5-9 PM</Text>
                                    <View style={styles.energyTags}>
                                        <View style={[styles.tag, { backgroundColor: colors.energy.peak + '20' }]}>
                                            <Text style={[styles.tagText, { color: colors.energy.peak }]}>🐺 Wolf</Text>
                                        </View>
                                        <View style={[styles.tag, { backgroundColor: colors.energy.high + '20' }]}>
                                            <Text style={[styles.tagText, { color: colors.energy.high }]}>Peak: 5 PM</Text>
                                        </View>
                                    </View>
                                </View>
                                <EnergyMeter level={energy.currentLevel} size={90} />
                            </View>
                        </HolographicCard>
                    </Animated.View>

                    {/* Today's Schedule */}
                    <Animated.View style={entry3}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Today's Schedule</Text>
                            <Text style={styles.sectionCount}>{todayEvents.length} meetings</Text>
                        </View>
                        {todayEvents.map((event) => (
                            <MeetingCard key={event.id} event={event} onPress={() => { }} />
                        ))}
                    </Animated.View>

                    {/* AI Suggestions */}
                    <Animated.View style={entry4}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Smart Suggestions</Text>
                            <Text style={styles.sectionSubtext}>AI-optimized slots</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.suggestionsScroll}
                            decelerationRate="fast"
                            snapToInterval={300}
                        >
                            {topSuggestions.map((sug) => (
                                <View key={sug.id} style={styles.suggestionItem}>
                                    <ScheduleSuggestionCard suggestion={sug} />
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <GlassButton title="🤖 AI Schedule" onPress={() => router.push('/(tabs)/schedule')} variant="primary" size="md" />
                        <GlassButton title="🌍 Team Globe" onPress={() => router.push('/(tabs)/team')} variant="secondary" size="md" />
                    </View>

                    {/* Ad Banner for free users */}
                    <AdBanner />

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>

            {/* Floating Action Button */}
            <FloatingActionButton actions={fabActions} />
        </BreathingGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    greeting: { fontFamily: fontFamilies.primary, fontSize: fontSizes.lg, color: colors.glass.textMuted },
    userName: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxxl, color: '#FFF' },
    dateContainer: { alignItems: 'flex-end' },
    dayName: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: colors.primary.light },
    dateText: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    notifBadge: {
        backgroundColor: colors.status.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    notifBadgeText: { fontFamily: fontFamilies.primaryBold, fontSize: 10, color: '#FFF' },
    energyCard: { marginBottom: spacing.xl },
    energyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    energyInfo: { flex: 1, marginRight: spacing.lg },
    sectionLabel: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.lg, color: '#FFF', marginBottom: spacing.xs },
    energyHint: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, marginBottom: spacing.md },
    energyTags: { flexDirection: 'row', gap: spacing.sm },
    tag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
    tagText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.xs },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    sectionCount: { fontFamily: fontFamilies.mono, fontSize: fontSizes.sm, color: colors.primary.light },
    sectionSubtext: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.secondary.main },
    suggestionsScroll: { paddingBottom: spacing.md },
    suggestionItem: { width: 300, marginRight: spacing.md },
    quickActions: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.xl },
    bottomSpacer: { height: 100 },
});
