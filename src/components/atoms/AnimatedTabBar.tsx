import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { springConfigs } from '../../theme/animations';

const { width: SCREEN_W } = Dimensions.get('window');

interface TabItem {
    name: string;
    label: string;
    icon: string;
    activeIcon: string;
}

interface AnimatedTabBarProps {
    tabs: TabItem[];
    activeIndex: number;
    onTabPress: (index: number) => void;
}

export function AnimatedTabBar({ tabs, activeIndex, onTabPress }: AnimatedTabBarProps) {
    const indicatorX = useSharedValue(0);
    const tabWidth = (SCREEN_W - 32) / tabs.length;

    useEffect(() => {
        indicatorX.value = withSpring(activeIndex * tabWidth, springConfigs.snappy);
    }, [activeIndex, tabWidth]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                {/* Sliding indicator */}
                <Animated.View
                    style={[styles.indicator, indicatorStyle, { width: tabWidth }]}
                >
                    <View style={styles.indicatorGlow} />
                </Animated.View>

                {/* Tabs */}
                {tabs.map((tab, index) => (
                    <TabButton
                        key={tab.name}
                        tab={tab}
                        isActive={index === activeIndex}
                        onPress={() => onTabPress(index)}
                        width={tabWidth}
                    />
                ))}
            </View>
        </View>
    );
}

function TabButton({
    tab,
    isActive,
    onPress,
    width,
}: {
    tab: TabItem;
    isActive: boolean;
    onPress: () => void;
    width: number;
}) {
    const scale = useSharedValue(1);
    const iconScale = useSharedValue(isActive ? 1.15 : 1);

    useEffect(() => {
        iconScale.value = withSpring(isActive ? 1.15 : 1, springConfigs.bouncy);
    }, [isActive]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => {
                scale.value = withSpring(0.9, springConfigs.button);
            }}
            onPressOut={() => {
                scale.value = withSpring(1, springConfigs.button);
            }}
            style={[styles.tab, { width }]}
        >
            <Animated.View style={[styles.tabContent, animatedIconStyle]}>
                <Text style={styles.tabIcon}>
                    {isActive ? tab.activeIcon : tab.icon}
                </Text>
                <Text
                    style={[
                        styles.tabLabel,
                        isActive && styles.tabLabelActive,
                    ]}
                >
                    {tab.label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 28,
        paddingTop: 8,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: colors.dark.card + 'E8',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glass.border,
        position: 'relative',
        height: 64,
        alignItems: 'center',
        overflow: 'hidden',
    },
    indicator: {
        position: 'absolute',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorGlow: {
        width: '70%',
        height: '70%',
        borderRadius: 16,
        backgroundColor: colors.primary.main + '20',
    },
    tab: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tabContent: {
        alignItems: 'center',
        gap: 2,
    },
    tabIcon: {
        fontSize: 22,
    },
    tabLabel: {
        fontFamily: fontFamilies.primaryMedium,
        fontSize: 10,
        color: colors.glass.textMuted,
    },
    tabLabelActive: {
        color: colors.primary.light,
    },
});
