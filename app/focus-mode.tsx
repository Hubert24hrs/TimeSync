import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BreathingGradient } from '../src/components/atoms/BreathingGradient';
import { HolographicCard } from '../src/components/atoms/HolographicCard';
import { FloatingCard } from '../src/components/atoms/FloatingCard';
import { GlassButton } from '../src/components/atoms/GlassButton';
import { GlowingOrb } from '../src/components/atoms/GlowingOrb';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';

const FOCUS_PRESETS = [
    { id: 'pomodoro', label: 'Pomodoro', minutes: 25, emoji: '🍅', color: colors.status.error },
    { id: 'deep', label: 'Deep Work', minutes: 90, emoji: '🧠', color: colors.primary.main },
    { id: 'quick', label: 'Quick Focus', minutes: 15, emoji: '⚡', color: colors.accent.yellow },
    { id: 'custom', label: 'Custom', minutes: 0, emoji: '⚙️', color: colors.glass.textMuted },
];

export default function FocusModeScreen() {
    const [selectedPreset, setSelectedPreset] = useState('deep');
    const [isActive, setIsActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(90 * 60); // seconds
    const ringProgress = useSharedValue(0);

    const preset = FOCUS_PRESETS.find((p) => p.id === selectedPreset)!;
    const totalSeconds = preset.minutes * 60;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((t) => t - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, timeRemaining]);

    useEffect(() => {
        if (isActive) {
            ringProgress.value = withTiming(1, {
                duration: totalSeconds * 1000,
                easing: Easing.linear,
            });
        } else {
            ringProgress.value = 0;
        }
    }, [isActive]);

    const startFocus = () => {
        setTimeRemaining(preset.minutes * 60);
        setIsActive(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const stopFocus = () => {
        setIsActive(false);
        ringProgress.value = withTiming(0, { duration: 300 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Ring progress tracking (used for future SVG ring)
    const _ringProgress = useSharedValue(0);

    return (
        <BreathingGradient>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <Text style={styles.backButton}>← Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Focus Mode</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Timer circle */}
                    <View style={styles.timerContainer}>
                        <GlowingOrb
                            color={preset.color}
                            size={300}
                            intensity={isActive ? 0.15 : 0.05}
                            style={{ top: -50, left: -50 }}
                        />
                        <View style={styles.timerRing}>
                            {/* Background ring */}
                            <View style={[styles.ringTrack, { borderColor: colors.dark.surface }]} />
                            {/* Progress indicator */}
                            <View style={styles.timerInner}>
                                <Text style={styles.timerEmoji}>{preset.emoji}</Text>
                                <Text style={styles.timerText}>
                                    {formatTime(timeRemaining)}
                                </Text>
                                <Text style={styles.timerLabel}>
                                    {isActive ? 'Focusing...' : 'Ready'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Presets */}
                    {!isActive && (
                        <>
                            <Text style={styles.sectionTitle}>Focus Presets</Text>
                            <View style={styles.presetsGrid}>
                                {FOCUS_PRESETS.filter((p) => p.id !== 'custom').map((p) => (
                                    <Pressable key={p.id} onPress={() => {
                                        setSelectedPreset(p.id);
                                        setTimeRemaining(p.minutes * 60);
                                    }}>
                                        <FloatingCard
                                            glowColor={p.color}
                                            floatHeight={selectedPreset === p.id ? 6 : 3}
                                            floatDuration={2500 + Math.random() * 1000}
                                            style={selectedPreset === p.id ? [styles.presetCard, { borderColor: p.color + '60' }] : styles.presetCard}
                                        >
                                            <Text style={styles.presetEmoji}>{p.emoji}</Text>
                                            <Text style={styles.presetLabel}>{p.label}</Text>
                                            <Text style={[styles.presetTime, { color: p.color }]}>{p.minutes}m</Text>
                                        </FloatingCard>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}

                    {/* What happens in focus mode */}
                    {!isActive && (
                        <>
                            <Text style={styles.sectionTitle}>During Focus</Text>
                            <HolographicCard>
                                {[
                                    { icon: '🔕', text: 'Meeting notifications silenced' },
                                    { icon: '🚫', text: 'Scheduling requests blocked' },
                                    { icon: '📊', text: 'Energy tracking continues' },
                                    { icon: '🏆', text: 'Focus streak tracked' },
                                ].map((item, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Text style={styles.featureIcon}>{item.icon}</Text>
                                        <Text style={styles.featureText}>{item.text}</Text>
                                    </View>
                                ))}
                            </HolographicCard>
                        </>
                    )}

                    {/* Action button */}
                    <View style={styles.actionContainer}>
                        <GlassButton
                            title={isActive ? '⏹ End Focus Session' : '▶ Start Focusing'}
                            onPress={isActive ? stopFocus : startFocus}
                            variant={isActive ? 'ghost' : 'primary'}
                            size="lg"
                            fullWidth
                        />
                    </View>

                    <View style={{ height: spacing.huge }} />
                </ScrollView>
            </SafeAreaView>
        </BreathingGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    backButton: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: colors.primary.light },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    timerContainer: { alignItems: 'center', marginVertical: spacing.xl, position: 'relative' },
    timerRing: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center' },
    ringTrack: { ...StyleSheet.absoluteFillObject, borderRadius: 120, borderWidth: 4 },
    timerInner: { alignItems: 'center' },
    timerEmoji: { fontSize: 40, marginBottom: spacing.sm },
    timerText: { fontFamily: fontFamilies.monoBold, fontSize: 48, color: '#FFF' },
    timerLabel: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted, marginTop: 4 },
    sectionTitle: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: colors.glass.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.lg },
    presetsGrid: { flexDirection: 'row', gap: spacing.md },
    presetCard: { alignItems: 'center', width: 100, paddingVertical: spacing.lg },
    presetEmoji: { fontSize: 28, marginBottom: spacing.xs },
    presetLabel: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.sm, color: '#FFF', marginBottom: 4 },
    presetTime: { fontFamily: fontFamilies.mono, fontSize: fontSizes.sm },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
    featureIcon: { fontSize: 22 },
    featureText: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: 'rgba(255,255,255,0.85)' },
    actionContainer: { marginTop: spacing.xl },
});
