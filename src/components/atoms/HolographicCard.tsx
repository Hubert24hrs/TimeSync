import React from 'react';
import { StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
}

export function HolographicCard({
    children,
    style,
    glowColor = colors.primary.main,
    onPress,
    noPadding = false,
}: HolographicCardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (onPress) scale.value = withSpring(0.98, springConfigs.snappy);
    };

    const handlePressOut = () => {
        if (onPress) scale.value = withSpring(1, springConfigs.gentle);
    };

    const content = (
        <Animated.View style={[animatedStyle]}>
            <LinearGradient
                colors={[colors.dark.card, colors.dark.elevated]}
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
                {children}
            </LinearGradient>
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
});
