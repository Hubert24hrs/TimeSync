import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useAds } from '../../hooks/useAds';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export function AdBanner() {
    const { shouldShowAds, onBannerImpression } = useAds();

    if (!shouldShowAds) return null;

    // Mock ad banner for development
    // In production, this would use react-native-google-mobile-ads BannerAd component
    return (
        <View style={styles.container}>
            <View style={styles.banner}>
                <Text style={styles.adLabel}>AD</Text>
                <Text style={styles.adText}>Sponsored • Upgrade to remove ads</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    banner: {
        backgroundColor: colors.dark.surface,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    adLabel: {
        fontFamily: fontFamilies.mono,
        fontSize: fontSizes.xs,
        color: colors.glass.textMuted,
        backgroundColor: colors.dark.elevated,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    adText: {
        fontFamily: fontFamilies.primary,
        fontSize: fontSizes.sm,
        color: colors.glass.textMuted,
        flex: 1,
    },
});
