import React from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { GradientBackground } from '../../src/components/atoms/GradientBackground';
import { HolographicCard } from '../../src/components/atoms/HolographicCard';
import { EnergyMeter } from '../../src/components/molecules/EnergyMeter';
import { useAnimatedEntry } from '../../src/hooks/useAnimatedEntry';
import { useSelector } from 'react-redux';
import { RootState } from '../../src/store/store';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 160;

const weeklyData = [6, 7, 8, 7, 6, 5, 7];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const tips = [
    { emoji: '🧘', text: 'Schedule creative work between 5-9 PM (your peak)' },
    { emoji: '☕', text: 'Avoid meetings before 10 AM — your energy is low' },
    { emoji: '🛌', text: 'Your sleep pattern suggests a Wolf chronotype' },
    { emoji: '⚡', text: 'Take a 15-min break at 3 PM to recharge' },
];

export default function InsightsScreen() {
    const energy = useSelector((state: RootState) => state.energy);
    const entry0 = useAnimatedEntry(0);
    const entry1 = useAnimatedEntry(1);
    const entry2 = useAnimatedEntry(2);
    const entry3 = useAnimatedEntry(3);

    // Generate SVG path for the weekly chart
    const maxVal = 10;
    const points = weeklyData.map((val, i) => ({
        x: (i / (weeklyData.length - 1)) * CHART_WIDTH,
        y: CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT,
    }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={entry0}>
                        <Text style={styles.title}>Energy Insights</Text>
                        <Text style={styles.subtitle}>Your productivity intelligence</Text>
                    </Animated.View>

                    {/* Current Energy */}
                    <Animated.View style={entry1}>
                        <HolographicCard glowColor={colors.energy.peak}>
                            <View style={styles.energyOverviewRow}>
                                <View style={styles.energyOverviewInfo}>
                                    <Text style={styles.cardTitle}>Current Energy</Text>
                                    <Text style={styles.cardSubtitle}>Based on your patterns</Text>
                                    <View style={styles.statsRow}>
                                        <View style={styles.stat}>
                                            <Text style={styles.statValue}>5 PM</Text>
                                            <Text style={styles.statLabel}>Next Peak</Text>
                                        </View>
                                        <View style={styles.stat}>
                                            <Text style={[styles.statValue, { color: colors.status.warning }]}>{(energy.burnoutRisk * 100).toFixed(0)}%</Text>
                                            <Text style={styles.statLabel}>Burnout Risk</Text>
                                        </View>
                                    </View>
                                </View>
                                <EnergyMeter level={energy.currentLevel} size={100} />
                            </View>
                        </HolographicCard>
                    </Animated.View>

                    {/* Weekly Chart */}
                    <Animated.View style={entry2}>
                        <HolographicCard glowColor={colors.secondary.main}>
                            <Text style={styles.cardTitle}>Weekly Energy Pattern</Text>
                            <View style={styles.chartContainer}>
                                <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30} viewBox={`-5 -5 ${CHART_WIDTH + 10} ${CHART_HEIGHT + 35}`}>
                                    {/* Grid lines */}
                                    {[0, 2.5, 5, 7.5, 10].map((val) => (
                                        <Line key={val} x1={0} y1={CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT} stroke={colors.glass.border} strokeWidth={0.5} />
                                    ))}
                                    {/* Area fill */}
                                    <Path d={areaD} fill={colors.primary.main + '15'} />
                                    {/* Line */}
                                    <Path d={pathD} fill="none" stroke={colors.primary.main} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                    {/* Data points */}
                                    {points.map((p, i) => (
                                        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.primary.main} stroke={colors.dark.card} strokeWidth={2} />
                                    ))}
                                    {/* Day labels */}
                                    {days.map((day, i) => {
                                        const x = (i / (days.length - 1)) * CHART_WIDTH;
                                        return (
                                            <Rect key={`bg-${i}`} x={x - 12} y={CHART_HEIGHT + 8} width={24} height={16} rx={4} fill="transparent">
                                                {/* We'll use Text component outside SVG for labels */}
                                            </Rect>
                                        );
                                    })}
                                </Svg>
                                <View style={styles.dayLabelsRow}>
                                    {days.map((day, i) => (
                                        <Text key={day} style={styles.dayLabel}>{day}</Text>
                                    ))}
                                </View>
                            </View>
                        </HolographicCard>
                    </Animated.View>

                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
                        <HolographicCard glowColor={colors.accent.pink} style={styles.miniCard}>
                            <Text style={styles.miniCardEmoji}>📅</Text>
                            <Text style={styles.miniCardValue}>12</Text>
                            <Text style={styles.miniCardLabel}>Meetings</Text>
                            <Text style={styles.miniCardSub}>this week</Text>
                        </HolographicCard>
                        <HolographicCard glowColor={colors.secondary.main} style={styles.miniCard}>
                            <Text style={styles.miniCardEmoji}>🔒</Text>
                            <Text style={styles.miniCardValue}>6h</Text>
                            <Text style={styles.miniCardLabel}>Focus Time</Text>
                            <Text style={styles.miniCardSub}>protected</Text>
                        </HolographicCard>
                        <HolographicCard glowColor={colors.accent.yellow} style={styles.miniCard}>
                            <Text style={styles.miniCardEmoji}>⏱</Text>
                            <Text style={styles.miniCardValue}>45m</Text>
                            <Text style={styles.miniCardLabel}>Avg Duration</Text>
                            <Text style={styles.miniCardSub}>per meeting</Text>
                        </HolographicCard>
                        <HolographicCard glowColor={colors.status.success} style={styles.miniCard}>
                            <Text style={styles.miniCardEmoji}>✅</Text>
                            <Text style={styles.miniCardValue}>94%</Text>
                            <Text style={styles.miniCardLabel}>Attendance</Text>
                            <Text style={styles.miniCardSub}>rate</Text>
                        </HolographicCard>
                    </View>

                    {/* Tips */}
                    <Animated.View style={entry3}>
                        <Text style={styles.sectionTitle}>AI Recommendations</Text>
                        {tips.map((tip, i) => (
                            <HolographicCard key={i} glowColor={colors.primary.main + '40'} style={styles.tipCard}>
                                <View style={styles.tipRow}>
                                    <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                                    <Text style={styles.tipText}>{tip.text}</Text>
                                </View>
                            </HolographicCard>
                        ))}
                    </Animated.View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxxl, color: '#FFF', marginBottom: spacing.xs },
    subtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted, marginBottom: spacing.xl },
    cardTitle: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: '#FFF', marginBottom: spacing.xs },
    cardSubtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, marginBottom: spacing.md },
    energyOverviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    energyOverviewInfo: { flex: 1, marginRight: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.xl },
    stat: {},
    statValue: { fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xl, color: colors.primary.light },
    statLabel: { fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    chartContainer: { marginTop: spacing.md },
    dayLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: spacing.xs },
    dayLabel: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.xs, color: colors.glass.textMuted, width: 30, textAlign: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginVertical: spacing.lg },
    miniCard: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2 - 1, alignItems: 'center', paddingVertical: spacing.lg },
    miniCardEmoji: { fontSize: 24, marginBottom: spacing.sm },
    miniCardValue: { fontFamily: fontFamilies.monoBold, fontSize: fontSizes.xxl, color: '#FFF' },
    miniCardLabel: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.glass.text },
    miniCardSub: { fontFamily: fontFamilies.primary, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xl, color: '#FFF', marginBottom: spacing.lg },
    tipCard: { marginBottom: spacing.sm },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    tipEmoji: { fontSize: 24 },
    tipText: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.text, flex: 1, lineHeight: 22 },
    bottomSpacer: { height: 100 },
});
