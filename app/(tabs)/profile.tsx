import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store/store';
import { GradientBackground } from '../../src/components/atoms/GradientBackground';
import { HolographicCard } from '../../src/components/atoms/HolographicCard';
import { GlassButton } from '../../src/components/atoms/GlassButton';
import { useAnimatedEntry } from '../../src/hooks/useAnimatedEntry';
import { currentUser } from '../../src/constants/mockData';
import { chronotypes } from '../../src/constants/chronotypes';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const profileStats = [
    { label: 'Meetings/Week', value: '12', emoji: '📅' },
    { label: 'Avg Energy', value: '7.2', emoji: '⚡' },
    { label: 'Focus Hours', value: '18h', emoji: '🔒' },
    { label: 'Timezone', value: 'EST', emoji: '🌎' },
];

const quickLinks = [
    { label: 'Settings', emoji: '⚙️', route: '/settings' },
    { label: 'Cultural Calendar', emoji: '🌍', route: '/cultural-calendar' },
    { label: 'Meeting Optimizer', emoji: '🎯', route: '/meeting-optimizer' },
    { label: 'Data Export', emoji: '📤', route: '' },
];

export default function ProfileScreen() {
    const { user } = useSelector((state: RootState) => state.auth);
    const displayUser = user || currentUser;
    const chrono = chronotypes[displayUser.chronotype];

    const entry0 = useAnimatedEntry(0);
    const entry1 = useAnimatedEntry(1);
    const entry2 = useAnimatedEntry(2);
    const entry3 = useAnimatedEntry(3);

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <Animated.View style={[styles.profileHeader, entry0]}>
                        <LinearGradient
                            colors={[chrono.color + '60', chrono.color + '20']}
                            style={styles.avatarRing}
                        >
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarText}>
                                    {displayUser.name.split(' ').map((n) => n[0]).join('')}
                                </Text>
                            </View>
                        </LinearGradient>
                        <Text style={styles.userName}>{displayUser.name}</Text>
                        <Text style={styles.userEmail}>{displayUser.email}</Text>

                        {/* Chronotype Badge */}
                        <LinearGradient
                            colors={[chrono.color + '30', chrono.color + '15']}
                            style={styles.chronotypeBadge}
                        >
                            <Text style={styles.chronoEmoji}>{chrono.emoji}</Text>
                            <View>
                                <Text style={[styles.chronoType, { color: chrono.color }]}>
                                    {chrono.type.charAt(0).toUpperCase() + chrono.type.slice(1)} Chronotype
                                </Text>
                                <Text style={styles.chronoConfidence}>{Math.round(chrono.confidence * 100)}% confidence</Text>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Stats */}
                    <Animated.View style={entry1}>
                        <View style={styles.statsGrid}>
                            {profileStats.map((stat) => (
                                <HolographicCard key={stat.label} style={styles.statCard}>
                                    <Text style={styles.statEmoji}>{stat.emoji}</Text>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </HolographicCard>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Chronotype Description */}
                    <Animated.View style={entry2}>
                        <HolographicCard glowColor={chrono.color}>
                            <Text style={styles.sectionTitle}>Your Energy Profile</Text>
                            <Text style={styles.chronoDescription}>{chrono.description}</Text>
                            <View style={styles.peakHoursRow}>
                                <Text style={styles.peakLabel}>Peak Hours:</Text>
                                <Text style={[styles.peakValue, { color: chrono.color }]}>
                                    {chrono.peakHours.map((h) => `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`).join(', ')}
                                </Text>
                            </View>
                        </HolographicCard>
                    </Animated.View>

                    {/* Quick Links */}
                    <Animated.View style={entry3}>
                        <Text style={styles.sectionTitle}>Quick Access</Text>
                        {quickLinks.map((link) => (
                            <Pressable key={link.label} onPress={() => link.route && router.push(link.route as any)}>
                                <HolographicCard style={styles.linkCard}>
                                    <View style={styles.linkRow}>
                                        <Text style={styles.linkEmoji}>{link.emoji}</Text>
                                        <Text style={styles.linkLabel}>{link.label}</Text>
                                        <Text style={styles.linkArrow}>›</Text>
                                    </View>
                                </HolographicCard>
                            </Pressable>
                        ))}
                    </Animated.View>

                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>TimeSync v1.0.0</Text>
                    </View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    profileHeader: { alignItems: 'center', marginBottom: spacing.xxl },
    avatarRing: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    avatarInner: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.dark.card, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxxl, color: '#FFF' },
    userName: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF', marginBottom: spacing.xs },
    userEmail: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted, marginBottom: spacing.lg },
    chronotypeBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.glass.border },
    chronoEmoji: { fontSize: 28 },
    chronoType: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.md },
    chronoConfidence: { fontFamily: fontFamilies.mono, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    statCard: { width: '47%', alignItems: 'center', paddingVertical: spacing.lg },
    statEmoji: { fontSize: 22, marginBottom: spacing.xs },
    statValue: { fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xxl, color: '#FFF' },
    statLabel: { fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xl, color: '#FFF', marginBottom: spacing.md },
    chronoDescription: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.text, lineHeight: 24, marginBottom: spacing.md },
    peakHoursRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    peakLabel: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    peakValue: { fontFamily: fontFamilies.monoBold, fontSize: fontSizes.sm },
    linkCard: { marginBottom: spacing.sm },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    linkEmoji: { fontSize: 22 },
    linkLabel: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: '#FFF', flex: 1 },
    linkArrow: { fontSize: 24, color: colors.glass.textMuted },
    versionContainer: { alignItems: 'center', marginTop: spacing.xl },
    versionText: { fontFamily: fontFamilies.mono, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    bottomSpacer: { height: 100 },
});
