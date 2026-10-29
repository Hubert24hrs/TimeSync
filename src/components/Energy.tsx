import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { energyCurve, energyLabel } from '../engine';
import { energyColor, type, useTheme } from '../theme';
import { Txt } from '../ui/primitives';
import type { Chronotype } from '../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Animated ring showing energy 0–10. */
export function EnergyMeter({ level, size = 96 }: { level: number; size?: number }) {
    const { c } = useTheme();
    const clamped = Math.max(0, Math.min(10, level));
    const stroke = 9;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = withTiming(clamped / 10, { duration: 1100 });
    }, [clamped, progress]);
    const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));
    const color = energyColor(clamped, c);
    return (
        <View accessibilityRole="progressbar" accessibilityLabel={`Energy ${Math.round(clamped)} of 10, ${energyLabel(clamped)}`} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.border} strokeWidth={stroke} fill="none" />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <Txt style={[type.clock, { color, fontSize: size * 0.28, lineHeight: size * 0.34 }]}>{Math.round(clamped)}</Txt>
            <Txt variant="caption" tone="muted">
                {energyLabel(clamped)}
            </Txt>
        </View>
    );
}

/** 24-hour chronotype energy curve with a "now" marker. */
export function EnergyCurve({ chronotype, hour, width = 280, height = 80 }: { chronotype: Chronotype; hour: number; width?: number; height?: number }) {
    const { c } = useTheme();
    const curve = energyCurve(chronotype);
    const x = (h: number) => (h / 23) * width;
    const y = (v: number) => height - 6 - (v / 10) * (height - 12);
    const d = curve.map((v, h) => `${h === 0 ? 'M' : 'L'} ${x(h).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const nowLevel = curve[Math.floor(hour) % 24];
    return (
        <Svg width={width} height={height} accessibilityLabel={`Energy curve for ${chronotype}`}>
            <Defs>
                <LinearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={c.primary} stopOpacity={0.35} />
                    <Stop offset="1" stopColor={c.primary} stopOpacity={0} />
                </LinearGradient>
            </Defs>
            <Path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill="url(#energyFill)" />
            <Path d={d} stroke={c.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            <Circle cx={x(hour % 24)} cy={y(nowLevel)} r={5} fill={c.accent} stroke={c.bg} strokeWidth={2} />
        </Svg>
    );
}
