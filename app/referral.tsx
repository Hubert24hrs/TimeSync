import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store/store';
import { setReferralCode } from '../src/store/slices/referralSlice';
import { useAnalytics } from '../src/hooks/useAnalytics';
import { GradientBackground } from '../src/components/atoms/GradientBackground';
import { HolographicCard } from '../src/components/atoms/HolographicCard';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';

function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TS-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default function ReferralScreen() {
    const dispatch = useDispatch();
    const referral = useSelector((state: RootState) => state.referral);
    const user = useSelector((state: RootState) => state.auth.user);
    const { trackEvent, EVENTS } = useAnalytics();

    // Generate code if none exists
    if (!referral.code) {
        dispatch(setReferralCode(generateReferralCode()));
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join me on TimeSync — the AI scheduling app that respects your energy! Use my code ${referral.code} and we both get 1 week of Pro free! 🚀\n\nhttps://timesync.app/invite/${referral.code}`,
                title: 'Share TimeSync',
            });
            trackEvent(EVENTS.REFERRAL_SHARED, { code: referral.code || '' });
        } catch {
            // User cancelled share
        }
    };

    const rewards = [
        { count: 1, reward: '1 week Pro free', emoji: '🎁' },
        { count: 3, reward: '1 month Pro free', emoji: '🔥' },
        { count: 5, reward: '3 months Pro free', emoji: '💎' },
        { count: 10, reward: 'Lifetime Pro', emoji: '👑' },
    ];

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <Text style={styles.backButton}>← Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Refer & Earn</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Hero */}
                    <View style={styles.hero}>
                        <Text style={styles.heroEmoji}>🎉</Text>
                        <Text style={styles.heroTitle}>Share the Love</Text>
                        <Text style={styles.heroSubtitle}>
                            Invite friends and both of you get rewarded with free Pro access!
                        </Text>
                    </View>

                    {/* Referral code */}
                    <HolographicCard>
                        <Text style={styles.codeLabel}>Your Referral Code</Text>
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeText}>{referral.code || '...'}</Text>
                        </View>
                        <Pressable onPress={handleShare}>
                            <LinearGradient
                                colors={[colors.primary.main, colors.secondary.main] as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shareButton}
                            >
                                <Text style={styles.shareText}>Share Invite Link 📤</Text>
                            </LinearGradient>
                        </Pressable>
                    </HolographicCard>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <HolographicCard style={styles.statCard}>
                            <Text style={styles.statNumber}>{referral.totalReferrals}</Text>
                            <Text style={styles.statLabel}>Referred</Text>
                        </HolographicCard>
                        <HolographicCard style={styles.statCard}>
                            <Text style={styles.statNumber}>{referral.pendingRewards}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </HolographicCard>
                        <HolographicCard style={styles.statCard}>
                            <Text style={styles.statNumber}>{referral.claimedRewards}</Text>
                            <Text style={styles.statLabel}>Claimed</Text>
                        </HolographicCard>
                    </View>

                    {/* Reward tiers */}
                    <Text style={styles.sectionTitle}>Reward Milestones</Text>
                    {rewards.map((reward, i) => {
                        const achieved = referral.totalReferrals >= reward.count;
                        return (
                            <HolographicCard key={i} style={styles.rewardCard}>
                                <View style={styles.rewardRow}>
                                    <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                                    <View style={styles.rewardInfo}>
                                        <Text style={styles.rewardTitle}>{reward.count} Referral{reward.count > 1 ? 's' : ''}</Text>
                                        <Text style={styles.rewardDesc}>{reward.reward}</Text>
                                    </View>
                                    <View style={[styles.rewardBadge, achieved && styles.rewardBadgeAchieved]}>
                                        <Text style={styles.rewardBadgeText}>
                                            {achieved ? '✓' : `${referral.totalReferrals}/${reward.count}`}
                                        </Text>
                                    </View>
                                </View>
                            </HolographicCard>
                        );
                    })}

                    {/* How it works */}
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <HolographicCard>
                        {[
                            { step: '1', text: 'Share your unique code with friends' },
                            { step: '2', text: 'They sign up using your code' },
                            { step: '3', text: 'You both get 1 week of Pro free!' },
                        ].map((item, i) => (
                            <View key={i} style={styles.stepRow}>
                                <View style={styles.stepCircle}>
                                    <Text style={styles.stepNumber}>{item.step}</Text>
                                </View>
                                <Text style={styles.stepText}>{item.text}</Text>
                            </View>
                        ))}
                    </HolographicCard>

                    <View style={{ height: spacing.huge }} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    backButton: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: colors.primary.light },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    hero: { alignItems: 'center', marginBottom: spacing.xxl },
    heroEmoji: { fontSize: 56, marginBottom: spacing.md },
    heroTitle: { fontFamily: fontFamilies.displayBold, fontSize: 28, color: '#FFF', marginBottom: spacing.sm },
    heroSubtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.lg, color: colors.glass.textMuted, textAlign: 'center', lineHeight: 24, maxWidth: 300 },
    codeLabel: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.glass.textMuted, textAlign: 'center', marginBottom: spacing.md },
    codeContainer: { backgroundColor: colors.dark.bg, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.primary.main + '40', borderStyle: 'dashed' },
    codeText: { fontFamily: fontFamilies.mono, fontSize: 28, color: colors.primary.light, letterSpacing: 3 },
    shareButton: { borderRadius: borderRadius.pill, paddingVertical: spacing.md, alignItems: 'center' },
    shareText: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: '#FFF' },
    statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, marginTop: spacing.lg },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
    statNumber: { fontFamily: fontFamilies.displayBold, fontSize: 28, color: '#FFF' },
    statLabel: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, marginTop: 4 },
    sectionTitle: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: colors.glass.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.md },
    rewardCard: { marginBottom: spacing.sm },
    rewardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rewardEmoji: { fontSize: 28 },
    rewardInfo: { flex: 1 },
    rewardTitle: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: '#FFF' },
    rewardDesc: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    rewardBadge: { backgroundColor: colors.dark.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.pill },
    rewardBadgeAchieved: { backgroundColor: colors.status.success + '30' },
    rewardBadgeText: { fontFamily: fontFamilies.mono, fontSize: fontSizes.sm, color: colors.primary.light },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary.main + '20', alignItems: 'center', justifyContent: 'center' },
    stepNumber: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.md, color: colors.primary.light },
    stepText: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: 'rgba(255,255,255,0.85)', flex: 1 },
});
