import React from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamMember } from '../../types';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface GlobeVisualizerProps {
    members: TeamMember[];
    onSelectMember?: (member: TeamMember) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GLOBE_SIZE = SCREEN_WIDTH - 48;
const GLOBE_CENTER_X = GLOBE_SIZE / 2;
const GLOBE_CENTER_Y = GLOBE_SIZE / 2;
const GLOBE_RADIUS = GLOBE_SIZE * 0.42;

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
    const x = GLOBE_CENTER_X + (lng / 180) * GLOBE_RADIUS;
    const y = GLOBE_CENTER_Y - (lat / 90) * GLOBE_RADIUS * 0.6;
    return { x, y };
}

// Simplified continent outlines
const CONTINENTS = {
    northAmerica: 'M 80 95 Q 85 90 95 88 L 110 85 L 125 90 L 130 100 L 125 115 L 115 125 L 100 130 L 90 120 L 82 108 Z',
    southAmerica: 'M 108 140 L 115 135 L 120 140 L 122 155 L 118 170 L 112 178 L 105 175 L 103 160 L 105 148 Z',
    europe: 'M 165 82 L 170 78 L 178 80 L 182 85 L 180 92 L 175 95 L 168 93 L 165 88 Z',
    africa: 'M 162 100 L 172 98 L 180 105 L 182 120 L 178 138 L 170 145 L 162 140 L 158 125 L 160 110 Z',
    asia: 'M 185 72 L 200 68 L 225 72 L 240 82 L 245 95 L 240 108 L 228 112 L 215 108 L 200 105 L 190 98 L 185 88 Z',
    oceania: 'M 232 140 L 248 138 L 255 145 L 252 155 L 240 158 L 232 152 L 230 145 Z',
};

export function GlobeVisualizer({ members, onSelectMember }: GlobeVisualizerProps) {
    const currentHour = new Date().getUTCHours();
    const nightStartX = GLOBE_CENTER_X + ((((currentHour - 12) * 15) % 360 - 180) / 180) * GLOBE_RADIUS;

    return (
        <View style={styles.container}>
            <Svg width={GLOBE_SIZE} height={GLOBE_SIZE} viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}>
                <Defs>
                    <RadialGradient id="globeGradient" cx="50%" cy="50%" rx="50%" ry="50%">
                        <Stop offset="0%" stopColor={colors.dark.elevated} />
                        <Stop offset="75%" stopColor={colors.dark.card} />
                        <Stop offset="100%" stopColor={colors.dark.bg} />
                    </RadialGradient>
                </Defs>

                {/* Globe background */}
                <Circle cx={GLOBE_CENTER_X} cy={GLOBE_CENTER_Y} r={GLOBE_RADIUS} fill="url(#globeGradient)" stroke={colors.primary.main + '30'} strokeWidth={1.5} />

                {/* Grid lines */}
                {[-60, -30, 0, 30, 60].map((lat) => {
                    const y = GLOBE_CENTER_Y - (lat / 90) * GLOBE_RADIUS * 0.6;
                    return (
                        <Path
                            key={`lat-${lat}`}
                            d={`M ${GLOBE_CENTER_X - GLOBE_RADIUS} ${y} Q ${GLOBE_CENTER_X} ${y + (lat > 0 ? -5 : 5)} ${GLOBE_CENTER_X + GLOBE_RADIUS} ${y}`}
                            stroke={colors.glass.border}
                            strokeWidth={0.5}
                            fill="none"
                            opacity={0.3}
                        />
                    );
                })}

                {/* Continent paths - scaled to globe */}
                <G opacity={0.4}>
                    {Object.values(CONTINENTS).map((path, i) => (
                        <Path key={i} d={path} fill={colors.primary.main + '40'} stroke={colors.primary.main + '60'} strokeWidth={0.8} />
                    ))}
                </G>

                {/* Day/Night gradient overlay */}
                <Circle
                    cx={nightStartX}
                    cy={GLOBE_CENTER_Y}
                    r={GLOBE_RADIUS * 0.8}
                    fill={colors.dark.bg}
                    opacity={0.25}
                />

                {/* Team member pins */}
                {members.map((member) => {
                    const pos = latLngToXY(member.latitude || 0, member.longitude || 0);
                    const pinColor = member.status === 'online' ? colors.status.success : member.status === 'busy' ? colors.status.error : colors.glass.textMuted;
                    return (
                        <G key={member.id}>
                            <Circle cx={pos.x} cy={pos.y} r={12} fill={pinColor + '30'} />
                            <Circle cx={pos.x} cy={pos.y} r={6} fill={pinColor} stroke={colors.dark.bg} strokeWidth={2} />
                        </G>
                    );
                })}

                {/* Timezone arcs */}
                {[-12, -8, -4, 0, 4, 8].map((offset) => {
                    const x = GLOBE_CENTER_X + (offset / 12) * GLOBE_RADIUS;
                    return (
                        <Path
                            key={`tz-${offset}`}
                            d={`M ${x} ${GLOBE_CENTER_Y - GLOBE_RADIUS} L ${x} ${GLOBE_CENTER_Y + GLOBE_RADIUS}`}
                            stroke={colors.secondary.main + '20'}
                            strokeWidth={0.5}
                            strokeDasharray="4,4"
                        />
                    );
                })}
            </Svg>

            {/* Overlay member labels */}
            {members.map((member) => {
                const pos = latLngToXY(member.latitude || 0, member.longitude || 0);
                const pinColor = member.status === 'online' ? colors.status.success : member.status === 'busy' ? colors.status.error : '#666';
                return (
                    <Pressable
                        key={member.id}
                        style={[styles.memberPin, { left: pos.x - 8, top: pos.y - 8 }]}
                        onPress={() => onSelectMember?.(member)}
                        hitSlop={12}
                    >
                        <View style={[styles.pinInner, { borderColor: pinColor }]} />
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
    memberPin: { position: 'absolute', width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
    pinInner: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, backgroundColor: 'transparent' },
});
