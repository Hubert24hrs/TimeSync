import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface EnergyMeterProps {
    level: number;
    label?: string;
    size?: number;
    animated?: boolean;
}

function getEnergyColor(level: number): string {
    if (level >= 8) return colors.energy.peak;
    if (level >= 6) return colors.energy.high;
    if (level >= 4) return colors.energy.medium;
    return colors.energy.low;
}

function getEnergyLabel(level: number): string {
    if (level >= 8) return 'Peak';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
}

export function EnergyMeter({ level, label, size = 100, animated = true }: EnergyMeterProps) {
    const clampedLevel = Math.max(1, Math.min(10, level));
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = useSharedValue(0);

    useEffect(() => {
        if (animated) {
            progress.value = withTiming(clampedLevel / 10, { duration: 1200 });
        } else {
            progress.value = clampedLevel / 10;
        }
    }, [clampedLevel, animated]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    const energyColor = getEnergyColor(clampedLevel);
    const energyLabel = label || getEnergyLabel(clampedLevel);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} style={styles.svg}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.dark.elevated}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={energyColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.textContainer}>
                <Text style={[styles.value, { color: energyColor }]}>{clampedLevel}</Text>
                <Text style={styles.label}>{energyLabel}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    svg: { position: 'absolute' },
    textContainer: { alignItems: 'center' },
    value: { fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xxl },
    label: { fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, color: colors.glass.textMuted, marginTop: 2 },
});
