import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Path, Rect, Stop } from 'react-native-svg';
import { useNow } from '../hooks/useNow';
import { useTheme } from '../theme';
import type { Profile } from '../types';
import { Txt } from '../ui/primitives';

// World map (equirectangular) with a live day/night terminator and team pins.

const CONTINENTS: [number, number][][] = [
    [[-168, 65], [-140, 70], [-95, 72], [-60, 60], [-55, 50], [-80, 25], [-97, 18], [-105, 20], [-125, 40], [-130, 55]],
    [[-80, 10], [-60, 10], [-35, -7], [-40, -23], [-58, -38], [-68, -55], [-75, -45], [-72, -18], [-81, -5]],
    [[-10, 36], [-10, 44], [-5, 48], [5, 52], [10, 58], [28, 71], [40, 66], [40, 45], [28, 40], [15, 38]],
    [[-17, 15], [-10, 30], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -18], [9, 4], [-8, 5]],
    [[40, 45], [40, 66], [70, 73], [140, 72], [180, 68], [160, 55], [140, 40], [122, 30], [108, 10], [98, 8], [90, 22], [78, 8], [68, 24], [56, 25], [48, 30]],
    [[114, -22], [130, -12], [142, -11], [153, -26], [146, -39], [135, -35], [115, -34]],
];

/** Subsolar point for an instant (approximate, good to ~1°). */
function subsolar(ms: number): { lat: number; lon: number } {
    const d = new Date(ms);
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const day = (ms - start) / 86_400_000;
    const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10));
    const hours = d.getUTCHours() + d.getUTCMinutes() / 60;
    return { lat: decl, lon: (12 - hours) * 15 };
}

export function Globe({ members, width, onSelect }: { members: Profile[]; width: number; onSelect?: (p: Profile) => void }) {
    const { c, isDark } = useTheme();
    const now = useNow(60_000);
    const height = width / 2;
    const px = (lon: number) => ((lon + 180) / 360) * width;
    const py = (lat: number) => ((90 - lat) / 180) * height;

    const night = useMemo(() => {
        const sun = subsolar(now);
        const tanDecl = Math.tan((sun.lat * Math.PI) / 180) || 1e-6;
        const pts: string[] = [];
        for (let lon = -180; lon <= 180; lon += 4) {
            const lat = (Math.atan(-Math.cos(((lon - sun.lon) * Math.PI) / 180) / tanDecl) * 180) / Math.PI;
            pts.push(`${px(lon).toFixed(1)},${py(lat).toFixed(1)}`);
        }
        // Night is on the pole facing away from the sun.
        const edge = sun.lat > 0 ? height : 0;
        return `M 0 ${edge} L ${pts.join(' L ')} L ${width} ${edge} Z`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [now, width, height]);

    return (
        <View accessibilityLabel={`World map with ${members.length} teammates`} style={{ width, height }}>
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={c.primary} stopOpacity={isDark ? 0.16 : 0.08} />
                        <Stop offset="1" stopColor={c.accent} stopOpacity={isDark ? 0.1 : 0.06} />
                    </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={width} height={height} rx={18} fill="url(#sea)" />
                {[-60, -30, 0, 30, 60].map((lat) => (
                    <Line key={lat} x1={0} x2={width} y1={py(lat)} y2={py(lat)} stroke={c.border} strokeWidth={1} />
                ))}
                {Array.from({ length: 13 }, (_, i) => -180 + i * 30).map((lon) => (
                    <Line key={lon} y1={0} y2={height} x1={px(lon)} x2={px(lon)} stroke={c.border} strokeWidth={1} strokeDasharray="3,5" />
                ))}
                <G>
                    {CONTINENTS.map((poly, i) => (
                        <Path key={i} d={`M ${poly.map(([lon, lat]) => `${px(lon).toFixed(1)} ${py(lat).toFixed(1)}`).join(' L ')} Z`} fill={c.primary} fillOpacity={isDark ? 0.28 : 0.18} stroke={c.primary} strokeOpacity={0.4} strokeWidth={1} />
                    ))}
                </G>
                <Path d={night} fill={isDark ? '#000010' : '#1E1B4B'} fillOpacity={isDark ? 0.45 : 0.18} />
                {members.map((m) =>
                    m.latitude === undefined || m.longitude === undefined ? null : (
                        <G key={m.id}>
                            <Circle cx={px(m.longitude)} cy={py(m.latitude)} r={10} fill={c.accent} fillOpacity={0.25} />
                            <Circle cx={px(m.longitude)} cy={py(m.latitude)} r={4.5} fill={m.status === 'online' ? c.success : m.status === 'away' ? c.warning : c.textMuted} stroke={c.bg} strokeWidth={1.5} />
                        </G>
                    ),
                )}
            </Svg>
            {members.map((m) =>
                m.latitude === undefined || m.longitude === undefined ? null : (
                    <Pressable
                        key={m.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${m.name}, ${m.timezone}`}
                        onPress={() => onSelect?.(m)}
                        hitSlop={8}
                        style={{ position: 'absolute', left: px(m.longitude) - 12, top: py(m.latitude) - 12, width: 24, height: 24 }}
                    />
                ),
            )}
            <View style={{ position: 'absolute', right: 10, bottom: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: isDark ? '#000010' : '#1E1B4B', opacity: 0.5 }} />
                <Txt variant="caption" tone="muted">
                    Night now
                </Txt>
            </View>
        </View>
    );
}
