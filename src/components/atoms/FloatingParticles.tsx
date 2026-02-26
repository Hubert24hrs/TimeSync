import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    duration: number;
    delay: number;
}

const PARTICLE_COLORS = [
    colors.primary.main + '18',
    colors.secondary.main + '15',
    colors.accent.pink + '12',
    colors.primary.light + '10',
    colors.accent.yellow + '08',
];

function generateParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        x: Math.random() * SCREEN_W,
        y: Math.random() * SCREEN_H,
        size: 20 + Math.random() * 80,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        duration: 4000 + Math.random() * 6000,
        delay: Math.random() * 3000,
    }));
}

function FloatingOrb({ particle }: { particle: Particle }) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            particle.delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: particle.duration, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: particle.duration, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [0, -40]);
        const translateX = interpolate(progress.value, [0, 0.5, 1], [0, 15, 0]);
        const opacity = interpolate(progress.value, [0, 0.5, 1], [0.3, 0.8, 0.3]);
        const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1.1, 0.8]);

        return {
            transform: [{ translateY }, { translateX }, { scale }],
            opacity,
        };
    });

    return (
        <Animated.View
            style={[
                styles.orb,
                animatedStyle,
                {
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    borderRadius: particle.size / 2,
                    backgroundColor: particle.color,
                },
            ]}
        />
    );
}

interface FloatingParticlesProps {
    count?: number;
}

export function FloatingParticles({ count = 8 }: FloatingParticlesProps) {
    const particles = React.useMemo(() => generateParticles(count), [count]);

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((particle, i) => (
                <FloatingOrb key={i} particle={particle} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
    },
});
