import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface GlowingOrbProps {
    color?: string;
    size?: number;
    intensity?: number;
    style?: ViewStyle;
}

export function GlowingOrb({
    color = colors.primary.main,
    size = 200,
    intensity = 0.15,
    style,
}: GlowingOrbProps) {
    const pulse = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        rotate.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const orbStyle = useAnimatedStyle(() => {
        const scale = interpolate(pulse.value, [0, 1], [0.8, 1.2]);
        const opacity = interpolate(pulse.value, [0, 1], [intensity * 0.6, intensity]);

        return {
            transform: [
                { scale },
                { rotate: `${rotate.value}deg` },
            ],
            opacity,
        };
    });

    return (
        <Animated.View
            style={[
                styles.orb,
                orbStyle,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    shadowColor: color,
                    shadowRadius: size / 3,
                    shadowOpacity: 0.6,
                },
                style,
            ]}
            pointerEvents="none"
        />
    );
}

const styles = StyleSheet.create({
    orb: {
        position: 'absolute',
        shadowOffset: { width: 0, height: 0 },
    },
});
