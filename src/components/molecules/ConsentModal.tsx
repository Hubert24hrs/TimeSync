import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { setConsent } from '../../store/slices/adsSlice';
import { RootState } from '../../store/store';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export function ConsentModal() {
    const dispatch = useDispatch();
    const { consentGiven, consentShownAt } = useSelector((state: RootState) => state.ads);
    const [personalizedAds, setPersonalizedAds] = useState(false);
    const [analytics, setAnalytics] = useState(true);
    const [visible, setVisible] = useState(!consentGiven && !consentShownAt);

    if (!visible) return null;

    const handleAcceptAll = () => {
        dispatch(setConsent({ given: true, personalizedAds: true, analytics: true }));
        setVisible(false);
    };

    const handleAcceptSelected = () => {
        dispatch(setConsent({ given: true, personalizedAds, analytics }));
        setVisible(false);
    };

    const handleRejectAll = () => {
        dispatch(setConsent({ given: true, personalizedAds: false, analytics: false }));
        setVisible(false);
    };

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.overlay}>
                <LinearGradient
                    colors={[colors.dark.card, colors.dark.bg] as [string, string]}
                    style={styles.container}
                >
                    <Text style={styles.icon}>🛡️</Text>
                    <Text style={styles.title}>Your Privacy Matters</Text>
                    <Text style={styles.description}>
                        We use cookies and similar technologies to improve your experience.
                        You can choose which categories to allow below.
                    </Text>

                    {/* Essential - always on */}
                    <View style={styles.optionRow}>
                        <View style={styles.optionInfo}>
                            <Text style={styles.optionLabel}>Essential</Text>
                            <Text style={styles.optionDesc}>Required for app functionality</Text>
                        </View>
                        <View style={[styles.toggle, styles.toggleOn]}>
                            <Text style={styles.toggleText}>Always On</Text>
                        </View>
                    </View>

                    {/* Analytics */}
                    <Pressable style={styles.optionRow} onPress={() => setAnalytics(!analytics)}>
                        <View style={styles.optionInfo}>
                            <Text style={styles.optionLabel}>Analytics</Text>
                            <Text style={styles.optionDesc}>Help us improve the app</Text>
                        </View>
                        <View style={[styles.toggle, analytics ? styles.toggleOn : styles.toggleOff]}>
                            <Text style={styles.toggleText}>{analytics ? 'On' : 'Off'}</Text>
                        </View>
                    </Pressable>

                    {/* Advertising */}
                    <Pressable style={styles.optionRow} onPress={() => setPersonalizedAds(!personalizedAds)}>
                        <View style={styles.optionInfo}>
                            <Text style={styles.optionLabel}>Personalized Ads</Text>
                            <Text style={styles.optionDesc}>Show relevant advertisements</Text>
                        </View>
                        <View style={[styles.toggle, personalizedAds ? styles.toggleOn : styles.toggleOff]}>
                            <Text style={styles.toggleText}>{personalizedAds ? 'On' : 'Off'}</Text>
                        </View>
                    </Pressable>

                    <View style={styles.actions}>
                        <Pressable onPress={handleAcceptAll}>
                            <LinearGradient
                                colors={[colors.primary.main, colors.primary.dark] as [string, string]}
                                style={styles.primaryButton}
                            >
                                <Text style={styles.primaryButtonText}>Accept All</Text>
                            </LinearGradient>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={handleAcceptSelected}>
                            <Text style={styles.secondaryButtonText}>Accept Selected</Text>
                        </Pressable>
                        <Pressable onPress={handleRejectAll}>
                            <Text style={styles.rejectText}>Reject Non-Essential</Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    container: {
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    icon: { fontSize: 40, textAlign: 'center', marginBottom: spacing.md },
    title: {
        fontFamily: fontFamilies.displayBold,
        fontSize: fontSizes.xxl,
        color: '#FFF',
        textAlign: 'center',
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
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.glass.border,
    },
    optionInfo: { flex: 1 },
    optionLabel: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: '#FFF' },
    optionDesc: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, marginTop: 2 },
    toggle: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.pill },
    toggleOn: { backgroundColor: colors.primary.main + '30' },
    toggleOff: { backgroundColor: colors.dark.surface },
    toggleText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.primary.light },
    actions: { marginTop: spacing.xl, gap: spacing.md, alignItems: 'center' },
    primaryButton: { paddingHorizontal: spacing.xxxl, paddingVertical: spacing.md, borderRadius: borderRadius.pill, width: '100%', alignItems: 'center' },
    primaryButtonText: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: '#FFF' },
    secondaryButton: { paddingVertical: spacing.sm, width: '100%', alignItems: 'center' },
    secondaryButtonText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.md, color: colors.primary.light },
    rejectText: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, marginTop: spacing.xs },
});
