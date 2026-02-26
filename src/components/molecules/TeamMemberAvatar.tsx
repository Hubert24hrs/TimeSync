import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PulseIndicator } from '../atoms/PulseIndicator';
import { TeamMember } from '../../types';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface TeamMemberAvatarProps {
    member: TeamMember;
    size?: number;
    showTime?: boolean;
    onPress?: () => void;
}

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getChronotypeColor(chronotype: string): readonly [string, string] {
    const map: Record<string, readonly [string, string]> = {
        lion: [colors.chronotype.lion, '#FFA502'] as const,
        bear: [colors.chronotype.bear, '#55E6C1'] as const,
        wolf: [colors.chronotype.wolf, '#A29BFE'] as const,
        dolphin: [colors.chronotype.dolphin, '#48DBFB'] as const,
    };
    return map[chronotype] || [colors.primary.main, colors.primary.light] as const;
}

export function TeamMemberAvatar({ member, size = 56, showTime = true, onPress }: TeamMemberAvatarProps) {
    const initials = getInitials(member.name);
    const ringColors = getChronotypeColor(member.chronotype);
    const innerSize = size - 6;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={ringColors as unknown as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
            >
                <View style={[styles.inner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
                    <Text style={[styles.initials, { fontSize: size * 0.3 }]}>{initials}</Text>
                </View>
            </LinearGradient>
            <View style={styles.statusBadge}>
                <PulseIndicator status={member.status} size={8} />
            </View>
            <Text style={styles.name} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
            {showTime && (
                <Text style={styles.time}>{member.localTime}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', width: 72 },
    ring: { alignItems: 'center', justifyContent: 'center', padding: 3 },
    inner: { backgroundColor: colors.dark.card, alignItems: 'center', justifyContent: 'center' },
    initials: { color: '#FFF', fontFamily: fontFamilies.primaryBold },
    statusBadge: { position: 'absolute', top: 0, right: 8 },
    name: { color: colors.glass.text, fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.xs, marginTop: spacing.xs, textAlign: 'center' },
    time: { color: colors.glass.textMuted, fontFamily: fontFamilies.mono, fontSize: 9 },
});
