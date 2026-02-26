import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { springConfigs } from '../src/theme/animations';
import { hashPin, verifyPin } from '../src/utils/security';

const { width: SCREEN_W } = Dimensions.get('window');
const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

interface AppLockScreenProps {
    onUnlock: () => void;
    storedPinHash?: string;
    isSetup?: boolean;
}

export default function AppLockScreen({
    onUnlock,
    storedPinHash,
    isSetup = false,
}: AppLockScreenProps) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const shakeX = useSharedValue(0);

    const shake = () => {
        shakeX.value = withSequence(
            withTiming(-12, { duration: 50 }),
            withTiming(12, { duration: 50 }),
            withTiming(-8, { duration: 50 }),
            withTiming(8, { duration: 50 }),
            withTiming(0, { duration: 50 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }],
    }));

    useEffect(() => {
        if (pin.length === PIN_LENGTH) {
            if (isSetup) {
                if (step === 'enter') {
                    setConfirmPin(pin);
                    setPin('');
                    setStep('confirm');
                } else {
                    if (pin === confirmPin) {
                        onUnlock();
                    } else {
                        setError("PINs don't match. Try again.");
                        shake();
                        setPin('');
                        setStep('enter');
                        setConfirmPin('');
                    }
                }
            } else {
                if (storedPinHash && verifyPin(pin, storedPinHash)) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onUnlock();
                } else {
                    setAttempts((a) => a + 1);
                    setError(attempts >= 2 ? `Wrong PIN. ${5 - attempts} attempts left.` : 'Incorrect PIN');
                    shake();
                    setPin('');
                }
            }
        }
    }, [pin]);

    const handleKey = (key: string) => {
        if (key === '⌫') {
            setPin((p) => p.slice(0, -1));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (key === '') {
            return;
        } else if (pin.length < PIN_LENGTH) {
            setPin((p) => p + key);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setError('');
        }
    };

    const title = isSetup
        ? step === 'enter' ? 'Set Your PIN' : 'Confirm PIN'
        : 'Welcome Back';

    const subtitle = isSetup
        ? step === 'enter' ? 'Choose a 4-digit PIN' : 'Enter the same PIN again'
        : 'Enter your PIN to unlock';

    return (
        <LinearGradient
            colors={[colors.dark.bg, '#0A0A1A', colors.dark.bg] as [string, string, string]}
            style={styles.container}
        >
            <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
                {/* Lock icon */}
                <Text style={styles.lockIcon}>🔐</Text>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                {/* PIN dots */}
                <Animated.View style={[styles.dotsRow, shakeStyle]}>
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i < pin.length && styles.dotFilled,
                                error && styles.dotError,
                            ]}
                        />
                    ))}
                </Animated.View>

                {/* Error */}
                {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorPlaceholder} />}

                {/* Keypad */}
                <View style={styles.keypad}>
                    {KEYS.map((key, i) => (
                        <KeypadButton key={i} label={key} onPress={() => handleKey(key)} />
                    ))}
                </View>

                {/* Biometric option */}
                {!isSetup && (
                    <Pressable style={styles.biometricButton}>
                        <Text style={styles.biometricText}>Use Face ID / Fingerprint</Text>
                    </Pressable>
                )}
            </Animated.View>
        </LinearGradient>
    );
}

function KeypadButton({ label, onPress }: { label: string; onPress: () => void }) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (!label) return <View style={styles.keyEmpty} />;

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => {
                scale.value = withSpring(0.85, springConfigs.button);
            }}
            onPressOut={() => {
                scale.value = withSpring(1, springConfigs.button);
            }}
        >
            <Animated.View style={[styles.key, animatedStyle]}>
                <Text style={styles.keyText}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
}

const KEYPAD_SIZE = (SCREEN_W - 120) / 3;

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    lockIcon: { fontSize: 56, marginBottom: spacing.lg },
    title: { fontFamily: fontFamilies.displayBold, fontSize: 28, color: '#FFF', marginBottom: spacing.xs },
    subtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted, marginBottom: spacing.xxl },
    dotsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.glass.border, backgroundColor: 'transparent' },
    dotFilled: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
    dotError: { borderColor: colors.status.error },
    error: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.status.error, height: 20, marginBottom: spacing.md },
    errorPlaceholder: { height: 20, marginBottom: spacing.md },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', width: KEYPAD_SIZE * 3 + 40, justifyContent: 'center', gap: spacing.md },
    key: { width: KEYPAD_SIZE, height: KEYPAD_SIZE * 0.7, borderRadius: borderRadius.lg, backgroundColor: colors.dark.card, borderWidth: 1, borderColor: colors.glass.border, alignItems: 'center', justifyContent: 'center' },
    keyEmpty: { width: KEYPAD_SIZE, height: KEYPAD_SIZE * 0.7 },
    keyText: { fontFamily: fontFamilies.displayBold, fontSize: 28, color: '#FFF' },
    biometricButton: { marginTop: spacing.xl },
    biometricText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.md, color: colors.primary.light },
});
