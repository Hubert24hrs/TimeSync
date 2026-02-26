import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSubscription } from '../../hooks/useSubscription';
import { useAnalytics } from '../../hooks/useAnalytics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

function DefaultUpgradePrompt({ feature }: { feature: string }) {
    const { trackEvent, EVENTS } = useAnalytics();

    const handleUpgrade = () => {
        trackEvent(EVENTS.FEATURE_GATE_HIT, { feature });
        router.push('/paywall');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.dark.card, colors.dark.elevated] as [string, string]}
                style={styles.card}
            >
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.title}>Premium Feature</Text>
                <Text style={styles.description}>
                    Upgrade to Pro to unlock this feature and get the most out of TimeSync.
                </Text>
                <Pressable onPress={handleUpgrade}>
                    <LinearGradient
                        colors={[colors.primary.main, colors.primary.dark] as [string, string]}
                        style={styles.upgradeButton}
                    >
                        <Text style={styles.upgradeText}>Upgrade to Pro ✨</Text>
                    </LinearGradient>
                </Pressable>
            </LinearGradient>
        </View>
    );
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
    const { canAccessFeature } = useSubscription();

    if (canAccessFeature(feature)) {
        return <>{children}</>;
    }

    return <>{fallback || <DefaultUpgradePrompt feature={feature} />}</>;
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    card: {
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glass.border,
        width: '100%',
        maxWidth: 340,
    },
    lockIcon: { fontSize: 48, marginBottom: spacing.lg },
    title: {
        fontFamily: fontFamilies.displayBold,
        fontSize: fontSizes.xxl,
        color: '#FFF',
        marginBottom: spacing.md,
    },
    description: {
        fontFamily: fontFamilies.primary,
        fontSize: fontSizes.md,
        color: colors.glass.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    upgradeButton: {
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.pill,
    },
    upgradeText: {
        fontFamily: fontFamilies.primaryBold,
        fontSize: fontSizes.lg,
        color: '#FFF',
    },
});
