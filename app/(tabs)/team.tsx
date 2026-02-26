import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../src/components/atoms/GradientBackground';
import { HolographicCard } from '../../src/components/atoms/HolographicCard';
import { TeamMemberAvatar } from '../../src/components/molecules/TeamMemberAvatar';
import { TimeZoneCard } from '../../src/components/molecules/TimeZoneCard';
import { GlobeVisualizer } from '../../src/components/organisms/GlobeVisualizer';
import { useAnimatedEntry } from '../../src/hooks/useAnimatedEntry';
import { teamMembers } from '../../src/constants/mockData';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { TeamMember } from '../../src/types';

export default function TeamScreen() {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    const entry0 = useAnimatedEntry(0);
    const entry1 = useAnimatedEntry(1);
    const entry2 = useAnimatedEntry(2);

    const onlineMembersCount = teamMembers.filter((m) => m.status === 'online').length;

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Animated.View style={[styles.header, entry0]}>
                        <Text style={styles.title}>Team Globe</Text>
                        <View style={styles.onlineBadge}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>{onlineMembersCount} online</Text>
                        </View>
                    </Animated.View>

                    {/* Globe Visualization */}
                    <Animated.View style={[styles.globeContainer, entry1]}>
                        <GlobeVisualizer
                            members={teamMembers}
                            onSelectMember={setSelectedMember}
                        />
                    </Animated.View>

                    {/* Selected Member Detail */}
                    {selectedMember && (
                        <HolographicCard glowColor={colors.secondary.main} style={styles.memberDetailCard}>
                            <View style={styles.memberDetailRow}>
                                <TeamMemberAvatar member={selectedMember} size={48} showTime={false} />
                                <View style={styles.memberDetailInfo}>
                                    <Text style={styles.memberDetailName}>{selectedMember.name}</Text>
                                    <Text style={styles.memberDetailRole}>{selectedMember.role}</Text>
                                    <Text style={styles.memberDetailTz}>{selectedMember.timezone} • {selectedMember.localTime}</Text>
                                </View>
                                <Pressable onPress={() => setSelectedMember(null)}>
                                    <Text style={styles.closeBtn}>✕</Text>
                                </Pressable>
                            </View>
                        </HolographicCard>
                    )}

                    {/* Team Members Row */}
                    <Animated.View style={entry2}>
                        <Text style={styles.sectionTitle}>Team Members</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarsRow}>
                            {teamMembers.map((member) => (
                                <Pressable key={member.id} onPress={() => setSelectedMember(member)}>
                                    <TeamMemberAvatar member={member} />
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Timezone Cards */}
                    <Text style={styles.sectionTitle}>Timezones</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tzRow}>
                        {teamMembers.slice(0, 5).map((member) => (
                            <TimeZoneCard
                                key={member.id}
                                timezone={member.timezone}
                                memberName={member.name.split(' ')[0]}
                            />
                        ))}
                    </ScrollView>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxxl, color: '#FFF' },
    onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.status.success + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.pill },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.status.success },
    onlineText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.status.success },
    globeContainer: { alignItems: 'center', marginBottom: spacing.xl },
    memberDetailCard: { marginBottom: spacing.xl },
    memberDetailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    memberDetailInfo: { flex: 1 },
    memberDetailName: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: '#FFF' },
    memberDetailRole: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.secondary.main },
    memberDetailTz: { fontFamily: fontFamilies.mono, fontSize: fontSizes.xs, color: colors.glass.textMuted },
    closeBtn: { fontSize: 18, color: colors.glass.textMuted, padding: spacing.sm },
    sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xl, color: '#FFF', marginBottom: spacing.lg },
    avatarsRow: { gap: spacing.md, paddingBottom: spacing.lg, marginBottom: spacing.lg },
    tzRow: { gap: spacing.md, paddingBottom: spacing.lg },
    bottomSpacer: { height: 100 },
});
