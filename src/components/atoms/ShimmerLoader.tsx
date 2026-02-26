import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface ShimmerLoaderProps {
    width: number | string;
    height: number;
    radius?: number;
    style?: ViewStyle;
}

export function ShimmerLoader({ width, height, radius = borderRadius.md, style }: ShimmerLoaderProps) {
    const shimmerValue = useSharedValue(0);

    useEffect(() => {
        shimmerValue.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shimmerValue.value, [0, 1], [-200, 200]) }],
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as number,
                    height,
                    borderRadius: radius,
                    backgroundColor: colors.dark.elevated,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                />
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 200,
    },
    gradient: {
        flex: 1,
    },
});
