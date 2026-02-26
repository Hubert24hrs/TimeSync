import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { springConfigs } from '../../theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export function GlassButton({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    style,
    textStyle,
    fullWidth = false,
}: GlassButtonProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.95, springConfigs.button);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, springConfigs.button);
    }, []);

    const handlePress = useCallback(() => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        }
    }, [disabled, loading, onPress]);

    const sizeStyles = sizes[size];
    const variantColors = variantMap[variant];

    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[animatedStyle, fullWidth && { width: '100%' }]}
            disabled={disabled || loading}
        >
            <LinearGradient
                colors={disabled ? ['#333', '#444'] : variantColors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.button,
                    sizeStyles.button,
                    disabled && styles.disabled,
                    style,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <>
                        {icon && <>{icon}</>}
                        <Text style={[styles.text, sizeStyles.text, textStyle]}>{title}</Text>
                    </>
                )}
            </LinearGradient>
        </AnimatedPressable>
    );
}

const variantMap = {
    primary: { gradient: ['#6C5CE7', '#A29BFE'] as const },
    secondary: { gradient: ['#00D2D3', '#0ABDE3'] as const },
    ghost: { gradient: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'] as const },
    accent: { gradient: ['#FD79A8', '#FDCB6E'] as const },
};

const sizes = {
    sm: {
        button: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.sm } as ViewStyle,
        text: { fontSize: fontSizes.sm } as TextStyle,
    },
    md: {
        button: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md } as ViewStyle,
        text: { fontSize: fontSizes.lg } as TextStyle,
    },
    lg: {
        button: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: borderRadius.lg } as ViewStyle,
        text: { fontSize: fontSizes.xl } as TextStyle,
    },
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    text: {
        color: '#FFFFFF',
        fontFamily: fontFamilies.primarySemiBold,
        letterSpacing: 0.5,
    },
    disabled: {
        opacity: 0.5,
    },
});
