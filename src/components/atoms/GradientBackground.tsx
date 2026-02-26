import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, colors } from '../../theme';

interface GradientBackgroundProps {
    children: React.ReactNode;
    colorOverride?: readonly string[];
    style?: ViewStyle;
}

export function GradientBackground({ children, colorOverride, style }: GradientBackgroundProps) {
    const { isDark } = useTheme();

    const gradientColors = colorOverride || (isDark
        ? [colors.dark.bg, colors.dark.card, colors.dark.bg]
        : [colors.light.bg, colors.light.elevated, colors.light.bg]);

    return (
        <LinearGradient
            colors={gradientColors as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
