import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useAnimatedProps } from 'react-native-reanimated';
import { useEffect } from 'react';
import { typography } from '../../theme/typography';
import { useTheme } from '../../theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyMedium' | 'caption' | 'label' | 'time' | 'timeLarge' | 'button';

interface AnimatedTextProps {
    children: string;
    style?: TextStyle;
    variant?: TextVariant;
    color?: string;
    animated?: boolean;
    numberOfLines?: number;
}

export function AnimatedText({
    children,
    style,
    variant = 'body',
    color,
    animated = false,
    numberOfLines,
}: AnimatedTextProps) {
    const { themeColors } = useTheme();
    const opacity = useSharedValue(animated ? 0 : 1);
    const translateY = useSharedValue(animated ? 10 : 0);

    useEffect(() => {
        if (animated) {
            opacity.value = withTiming(1, { duration: 600 });
            translateY.value = withTiming(0, { duration: 600 });
        }
    }, [animated]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    const variantStyle = typography[variant] || typography.body;

    return (
        <Animated.Text
            style={[
                variantStyle,
                { color: color || themeColors.text },
                animated ? animatedStyle : undefined,
                style,
            ]}
            numberOfLines={numberOfLines}
        >
            {children}
        </Animated.Text>
    );
}
