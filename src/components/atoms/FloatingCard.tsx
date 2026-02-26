import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springConfigs } from '../../theme/animations';

interface FloatingCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    glowColor?: string;
    floatHeight?: number;
    floatDuration?: number;
    onPress?: () => void;
}

export function FloatingCard({
    children,
    style,
    glowColor = colors.primary.main,
    floatHeight = 8,
    floatDuration = 3000,
    onPress,
}: FloatingCardProps) {
    const floatProgress = useSharedValue(0);
    const pressScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.3);

    useEffect(() => {
        // Continuous floating
        floatProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: floatDuration, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: floatDuration, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
        // Glow pulse
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const cardAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(floatProgress.value, [0, 1], [0, -floatHeight]);
        const rotate = interpolate(floatProgress.value, [0, 0.5, 1], [-0.3, 0.3, -0.3]);

        return {
            transform: [
                { translateY },
                { rotate: `${rotate}deg` },
                { scale: pressScale.value },
            ],
        };
    });

    const shadowStyle = useAnimatedStyle(() => {
        const shadowOpacity = interpolate(floatProgress.value, [0, 1], [0.2, 0.4]);
        const shadowScale = interpolate(floatProgress.value, [0, 1], [1, 0.92]);
        return {
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScale }, { scaleY: 0.15 }],
        };
    });

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const handlePressIn = () => {
        pressScale.value = withSpring(0.96, springConfigs.snappy);
    };

    const handlePressOut = () => {
        pressScale.value = withSpring(1, springConfigs.gentle);
    };

    return (
        <Animated.View style={[styles.wrapper]}>
            {/* Drop shadow beneath card */}
            <Animated.View
                style={[styles.shadow, shadowStyle, { backgroundColor: glowColor + '30' }]}
            />
            {/* Glow ring */}
            <Animated.View
                style={[
                    styles.glowRing,
                    glowStyle,
                    { borderColor: glowColor, shadowColor: glowColor },
                ]}
            />
            {/* Card */}
            <Animated.View style={[cardAnimatedStyle]}>
                <LinearGradient
                    colors={[colors.dark.card, colors.dark.elevated] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.card, { borderColor: glowColor + '25' }, style]}
                >
                    {children}
                </LinearGradient>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
    },
    card: {
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        padding: spacing.lg,
        overflow: 'hidden',
    },
    shadow: {
        position: 'absolute',
        bottom: -8,
        left: '10%',
        right: '10%',
        height: 30,
        borderRadius: 50,
    },
    glowRing: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
});
