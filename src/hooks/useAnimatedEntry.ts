import { useEffect, useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { springConfigs } from '../theme/animations';

export function useAnimatedEntry(index: number, delay: number = 80) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);

    useEffect(() => {
        const totalDelay = index * delay;
        opacity.value = withDelay(totalDelay, withTiming(1, { duration: 500 }));
        translateY.value = withDelay(totalDelay, withSpring(0, springConfigs.gentle));
    }, [index, delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return animatedStyle;
}
