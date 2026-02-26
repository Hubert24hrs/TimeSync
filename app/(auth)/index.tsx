import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store/store';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const { isOnboarded } = useSelector((state: RootState) => state.auth);

    // Animations
    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const subtitleOpacity = useSharedValue(0);
    const subtitleY = useSharedValue(20);
    const ring1Scale = useSharedValue(0);
    const ring1Opacity = useSharedValue(0);
    const ring2Scale = useSharedValue(0);
    const ring2Opacity = useSharedValue(0);
    const ring3Scale = useSharedValue(0);
    const ring3Opacity = useSharedValue(0);
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        // Logo animation
        logoOpacity.value = withTiming(1, { duration: 800 });
        logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });

        // Glow
        glowOpacity.value = withDelay(400, withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1500 }),
                withTiming(0.2, { duration: 1500 })
            ),
            -1, true
        ));

        // Rings expand outward
        ring1Scale.value = withDelay(300, withRepeat(withSequence(
            withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 0 })
        ), -1));
        ring1Opacity.value = withDelay(300, withRepeat(withSequence(
            withTiming(0, { duration: 2000 }),
            withTiming(0.5, { duration: 0 })
        ), -1));

        ring2Scale.value = withDelay(800, withRepeat(withSequence(
            withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 0 })
        ), -1));
        ring2Opacity.value = withDelay(800, withRepeat(withSequence(
            withTiming(0, { duration: 2000 }),
            withTiming(0.4, { duration: 0 })
        ), -1));

        ring3Scale.value = withDelay(1300, withRepeat(withSequence(
            withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 0 })
        ), -1));
        ring3Opacity.value = withDelay(1300, withRepeat(withSequence(
            withTiming(0, { duration: 2000 }),
            withTiming(0.3, { duration: 0 })
        ), -1));

        // Subtitle
        subtitleOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
        subtitleY.value = withDelay(1000, withSpring(0, { damping: 15, stiffness: 100 }));

        // Navigate after animation
        const timer = setTimeout(() => {
            if (isOnboarded) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(auth)/onboarding');
            }
        }, 2800);

        return () => clearTimeout(timer);
    }, [isOnboarded]);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const subtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
        transform: [{ translateY: subtitleY.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const makeRingStyle = (scaleVal: Animated.SharedValue<number>, opacityVal: Animated.SharedValue<number>) =>
        useAnimatedStyle(() => ({
            transform: [{ scale: scaleVal.value }],
            opacity: opacityVal.value,
        }));

    const ring1Style = makeRingStyle(ring1Scale, ring1Opacity);
    const ring2Style = makeRingStyle(ring2Scale, ring2Opacity);
    const ring3Style = makeRingStyle(ring3Scale, ring3Opacity);

    return (
        <LinearGradient
            colors={['#0F0F1E', '#1A1030', '#0F0F1E']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Animated rings */}
            <View style={styles.ringsContainer}>
                <Animated.View style={[styles.ring, ring1Style]}>
                    <View style={[styles.ringCircle, { borderColor: colors.primary.main }]} />
                </Animated.View>
                <Animated.View style={[styles.ring, ring2Style]}>
                    <View style={[styles.ringCircle, { borderColor: colors.secondary.main }]} />
                </Animated.View>
                <Animated.View style={[styles.ring, ring3Style]}>
                    <View style={[styles.ringCircle, { borderColor: colors.accent.pink }]} />
                </Animated.View>
            </View>

            {/* Glow effect */}
            <Animated.View style={[styles.glow, glowStyle]} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Text style={styles.logoIcon}>⏱</Text>
                <Text style={styles.logoText}>TimeSync</Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
                <Text style={styles.subtitle}>AI-Powered Scheduling</Text>
                <Text style={styles.tagline}>Sync your world, respect every timezone</Text>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    ringsContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
    ring: { position: 'absolute', width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
    ringCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 1.5 },
    glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.primary.main, opacity: 0.3 },
    logoContainer: { alignItems: 'center', zIndex: 10 },
    logoIcon: { fontSize: 64, marginBottom: 12 },
    logoText: { fontFamily: fontFamilies.displayBold, fontSize: 48, color: '#FFFFFF', letterSpacing: -1 },
    subtitleContainer: { position: 'absolute', bottom: height * 0.15, alignItems: 'center' },
    subtitle: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.xl, color: colors.primary.light, marginBottom: 8 },
    tagline: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted },
});
