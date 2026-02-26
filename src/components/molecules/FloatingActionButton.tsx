import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { springConfigs } from '../../theme/animations';

interface FABAction {
    id: string;
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
}

interface FloatingActionButtonProps {
    actions: FABAction[];
}

export function FloatingActionButton({ actions }: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    const toggleMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsOpen(!isOpen);
        rotation.value = withSpring(isOpen ? 0 : 45, springConfigs.bouncy);
    };

    const mainButtonStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotation.value}deg` },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Backdrop */}
            {isOpen && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={styles.backdrop}
                >
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={toggleMenu} />
                </Animated.View>
            )}

            {/* Action buttons */}
            {isOpen && actions.map((action, index) => (
                <FABActionButton
                    key={action.id}
                    action={action}
                    index={index}
                    total={actions.length}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        action.onPress();
                        setIsOpen(false);
                        rotation.value = withSpring(0, springConfigs.bouncy);
                    }}
                />
            ))}

            {/* Main FAB */}
            <Pressable
                onPress={toggleMenu}
                onPressIn={() => {
                    scale.value = withSpring(0.9, springConfigs.button);
                }}
                onPressOut={() => {
                    scale.value = withSpring(1, springConfigs.button);
                }}
            >
                <Animated.View style={[styles.mainButton, mainButtonStyle]}>
                    <Text style={styles.mainIcon}>+</Text>
                </Animated.View>
            </Pressable>
        </View>
    );
}

function FABActionButton({
    action,
    index,
    total,
    onPress,
}: {
    action: FABAction;
    index: number;
    total: number;
    onPress: () => void;
}) {
    const offset = (index + 1) * 70;

    return (
        <Animated.View
            entering={FadeIn.delay(index * 50).duration(200).springify()}
            exiting={FadeOut.duration(100)}
            style={[styles.actionRow, { bottom: offset }]}
        >
            <View style={styles.actionLabel}>
                <Text style={styles.actionLabelText}>{action.label}</Text>
            </View>
            <Pressable onPress={onPress}>
                <View style={[styles.actionButton, { backgroundColor: action.color + '25', borderColor: action.color + '50' }]}>
                    <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        alignItems: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        top: -1000,
        left: -500,
        right: -20,
        bottom: -100,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    mainButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary.main,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    mainIcon: {
        fontSize: 32,
        color: '#FFF',
        fontFamily: fontFamilies.primary,
        lineHeight: 34,
    },
    actionRow: {
        position: 'absolute',
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    actionLabel: {
        backgroundColor: colors.dark.card + 'E8',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.glass.border,
    },
    actionLabelText: {
        fontFamily: fontFamilies.primaryMedium,
        fontSize: fontSizes.sm,
        color: '#FFF',
    },
    actionButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    actionIcon: {
        fontSize: 22,
    },
});
