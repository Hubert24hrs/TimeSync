import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { FadeInRight, FadeOutRight, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface SmartNotification {
    id: string;
    type: 'meeting' | 'energy' | 'team' | 'tip';
    title: string;
    message: string;
    emoji: string;
    time?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const typeColors: Record<string, string> = {
    meeting: colors.primary.main,
    energy: colors.energy.peak,
    team: colors.secondary.main,
    tip: colors.accent.yellow,
};

interface SmartNotificationCardProps {
    notification: SmartNotification;
    index?: number;
    onDismiss?: () => void;
}

export function SmartNotificationCard({
    notification,
    index = 0,
    onDismiss,
}: SmartNotificationCardProps) {
    const color = typeColors[notification.type] || colors.primary.main;

    return (
        <Animated.View
            entering={SlideInRight.delay(index * 100).springify().damping(15)}
            exiting={FadeOutRight.duration(200)}
        >
            <LinearGradient
                colors={[color + '15', colors.dark.card] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, { borderColor: color + '30' }]}
            >
                <View style={styles.row}>
                    <Text style={styles.emoji}>{notification.emoji}</Text>
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>{notification.title}</Text>
                            {notification.time && (
                                <Text style={styles.time}>{notification.time}</Text>
                            )}
                        </View>
                        <Text style={styles.message}>{notification.message}</Text>
                        {notification.actionLabel && (
                            <Pressable
                                onPress={notification.onAction}
                                style={[styles.actionButton, { backgroundColor: color + '20' }]}
                            >
                                <Text style={[styles.actionText, { color }]}>
                                    {notification.actionLabel}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                    {onDismiss && (
                        <Pressable onPress={onDismiss} hitSlop={12}>
                            <Text style={styles.dismiss}>✕</Text>
                        </Pressable>
                    )}
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    emoji: { fontSize: 28, marginTop: 2 },
    content: { flex: 1 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontFamily: fontFamilies.primarySemiBold,
        fontSize: fontSizes.md,
        color: '#FFF',
    },
    time: {
        fontFamily: fontFamilies.mono,
        fontSize: fontSizes.xs,
        color: colors.glass.textMuted,
    },
    message: {
        fontFamily: fontFamilies.primary,
        fontSize: fontSizes.sm,
        color: colors.glass.textMuted,
        lineHeight: 20,
    },
    actionButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.pill,
        marginTop: spacing.sm,
    },
    actionText: {
        fontFamily: fontFamilies.primarySemiBold,
        fontSize: fontSizes.sm,
    },
    dismiss: {
        color: colors.glass.textMuted,
        fontSize: 16,
        padding: 4,
    },
});
