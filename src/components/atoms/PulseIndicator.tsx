import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface PulseIndicatorProps {
    status: 'online' | 'offline' | 'busy' | 'away';
    size?: number;
}

const statusColors: Record<string, string> = {
    online: colors.status.success,
    offline: '#666',
    busy: colors.status.error,
    away: colors.status.warning,
};

export function PulseIndicator({ status, size = 10 }: PulseIndicatorProps) {
    const scale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.6);

    useEffect(() => {
        if (status === 'online' || status === 'busy') {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.8, { duration: 1000 }),
                    withTiming(1, { duration: 0 })
                ),
                -1,
                false
            );
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0, { duration: 1000 }),
                    withTiming(0.6, { duration: 0 })
                ),
                -1,
                false
            );
        }
    }, [status]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: pulseOpacity.value,
    }));

    const color = statusColors[status];

    return (
        <View style={[styles.container, { width: size * 2.5, height: size * 2.5 }]}>
            {(status === 'online' || status === 'busy') && (
                <Animated.View
                    style={[
                        styles.pulse,
                        pulseStyle,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: color,
                        },
                    ]}
                />
            )}
            <View
                style={[
                    styles.dot,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: color,
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulse: {
        position: 'absolute',
    },
    dot: {
        borderWidth: 1.5,
        borderColor: colors.dark.bg,
    },
});
