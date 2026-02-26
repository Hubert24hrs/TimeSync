import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { springConfigs } from '../../theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HolographicCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    glowColor?: string;
    onPress?: () => void;
    noPadding?: boolean;
    animated?: boolean;
}

export function HolographicCard({
    children,
    style,
    glowColor = colors.primary.main,
    onPress,
    noPadding = false,
    animated = true,
}: HolographicCardProps) {
    const scale = useSharedValue(1);
    const shineSweep = useSharedValue(-1);
    const glowPulse = useSharedValue(0);

    useEffect(() => {
        if (!animated) return;
        // Shine sweep every 6 seconds
        shineSweep.value = withRepeat(
            withSequence(
                withTiming(-1, { duration: 0 }),
                withTiming(2, { duration: 1200, easing: Easing.inOut(Easing.cubic) }),
                withTiming(2, { duration: 4800 })
            ),
            -1,
            false
        );
        // Glow pulse
        glowPulse.value = withRepeat(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, [animated]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const shineStyle = useAnimatedStyle(() => {
        const translateX = interpolate(shineSweep.value, [-1, 2], [-300, 400]);
        const opacity = shineSweep.value > 0 && shineSweep.value < 1.5 ? 0.12 : 0;
        return {
            transform: [{ translateX }, { rotate: '25deg' }],
            opacity,
        };
    });

    const glowBorderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(glowPulse.value, [0, 1], [0.2, 0.5]);
        return { opacity };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.97, springConfigs.snappy);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, springConfigs.gentle);
    };

    const content = (
        <Animated.View style={[animatedStyle]}>
            <LinearGradient
                colors={[colors.dark.card, colors.dark.elevated] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.card,
                    !noPadding && styles.padding,
                    shadows.card,
                    { borderColor: glowColor + '30' },
                    style,
                ]}
            >
                {/* Children */}
                {children}

                {/* Shine sweep overlay */}
                <Animated.View style={[styles.shine, shineStyle]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent'] as [string, string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                </Animated.View>
            </LinearGradient>

            {/* Glow border pulse */}
            <Animated.View
                style={[
                    styles.glowBorder,
                    glowBorderStyle,
                    {
                        borderColor: glowColor,
                        shadowColor: glowColor,
                    },
                ]}
                pointerEvents="none"
            />
        </Animated.View>
    );

    if (onPress) {
        return (
            <AnimatedPressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={onPress}
            >
                {content}
            </AnimatedPressable>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    padding: {
        padding: spacing.lg,
    },
    shine: {
        position: 'absolute',
        top: -20,
        bottom: -20,
        width: 80,
    },
    glowBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
});
