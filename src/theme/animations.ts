import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

export const springConfigs: Record<string, WithSpringConfig> = {
    gentle: { damping: 15, stiffness: 150, mass: 1 },
    bouncy: { damping: 8, stiffness: 180, mass: 0.8 },
    snappy: { damping: 20, stiffness: 300, mass: 0.6 },
    slow: { damping: 25, stiffness: 80, mass: 1.2 },
    button: { damping: 12, stiffness: 200, mass: 0.5 },
    card: { damping: 18, stiffness: 120, mass: 1 },
} as const;

export const timingConfigs: Record<string, WithTimingConfig> = {
    fast: { duration: 200, easing: Easing.out(Easing.cubic) },
    normal: { duration: 350, easing: Easing.inOut(Easing.cubic) },
    slow: { duration: 600, easing: Easing.inOut(Easing.cubic) },
    shimmer: { duration: 1200, easing: Easing.linear },
    pulse: { duration: 1500, easing: Easing.inOut(Easing.sin) },
} as const;

export const animationDelays = {
    staggerShort: 50,
    staggerMedium: 100,
    staggerLong: 150,
    entryDelay: 200,
} as const;
