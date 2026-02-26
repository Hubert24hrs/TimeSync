import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolateColor,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface BreathingGradientProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function BreathingGradient({ children, style }: BreathingGradientProps) {
    const phase = useSharedValue(0);

    useEffect(() => {
        phase.value = withRepeat(
            withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const overlayStyle = useAnimatedStyle(() => {
        const opacity = phase.value * 0.08;
        return { opacity };
    });

    return (
        <LinearGradient
            colors={[colors.dark.bg, '#0A0A1A', colors.dark.bg] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.container, style]}
        >
            {/* Animated overlay that shifts subtly */}
            <Animated.View style={[styles.overlay, overlayStyle]}>
                <LinearGradient
                    colors={[colors.primary.main + '15', 'transparent', colors.secondary.main + '10'] as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
            </Animated.View>
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject },
});
