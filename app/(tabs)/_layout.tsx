import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '../../src/hooks/useLayout';
import { haptics } from '../../src/lib/haptics';
import { useAppSelector } from '../../src/store/store';
import { gradients, radius, spacing, type, useTheme } from '../../src/theme';
import { PressScale, Txt, type IconName } from '../../src/ui/primitives';

const TABS: Record<string, { label: string; icon: IconName; active: IconName }> = {
    index: { label: 'Today', icon: 'sunny-outline', active: 'sunny' },
    schedule: { label: 'Schedule', icon: 'calendar-outline', active: 'calendar' },
    team: { label: 'Team', icon: 'earth-outline', active: 'earth' },
    assistant: { label: 'Assistant', icon: 'sparkles-outline', active: 'sparkles' },
    profile: { label: 'Profile', icon: 'person-circle-outline', active: 'person-circle' },
};

function NewMeetingButton({ wide }: { wide?: boolean }) {
    return (
        <PressScale onPress={() => router.push('/new-meeting')} accessibilityLabel="New meeting">
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, paddingHorizontal: wide ? 18 : 0, height: 56, width: wide ? undefined : 56, justifyContent: 'center' }}>
                <Ionicons name="add" size={28} color="#FFF" />
                {wide ? <Txt style={[type.label, { color: '#FFF', fontSize: 15 }]}>New meeting</Txt> : null}
            </LinearGradient>
        </PressScale>
    );
}

function TabBar({ state, navigation }: BottomTabBarProps) {
    const { c, isDark } = useTheme();
    const { isWide } = useLayout();
    const insets = useSafeAreaInsets();
    const items = state.routes.map((route, index) => {
        const meta = TABS[route.name];
        const focused = state.index === index;
        const onPress = () => {
            haptics.select();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
            <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={meta.label}
                onPress={onPress}
                style={
                    isWide
                        ? { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: focused ? c.primarySoft : 'transparent' }
                        : { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8 }
                }
            >
                <Ionicons name={focused ? meta.active : meta.icon} size={isWide ? 20 : 23} color={focused ? c.primary : c.textMuted} />
                <Txt variant={isWide ? 'bodyStrong' : 'caption'} style={{ color: focused ? c.primary : c.textMuted, fontSize: isWide ? 15 : 11 }}>
                    {meta.label}
                </Txt>
            </Pressable>
        );
    });

    if (isWide) {
        return (
            <View style={{ width: 240, paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xs, borderRightWidth: 1, borderRightColor: c.border, backgroundColor: c.bgAlt }}>
                <Txt variant="h2" style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.md }}>
                    Time<Txt variant="h2" tone="primary">Sync</Txt>
                </Txt>
                <View style={{ marginBottom: spacing.lg }}>
                    <NewMeetingButton wide />
                </View>
                {items}
            </View>
        );
    }

    return (
        <>
            <View style={{ position: 'absolute', right: spacing.xl, bottom: insets.bottom + 84 }}>
                <NewMeetingButton />
            </View>
            <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: Math.max(insets.bottom, spacing.md), borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
                <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={{ flexDirection: 'row', backgroundColor: c.tabBar, paddingHorizontal: spacing.xs }}>{items}</View>
            </View>
        </>
    );
}

export default function TabsLayout() {
    const mode = useAppSelector((s) => s.auth.mode);
    const { isWide } = useLayout();
    if (mode === 'none') return <Redirect href="/welcome" />;
    return (
        <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, tabBarPosition: isWide ? 'left' : 'bottom', animation: 'shift' }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="schedule" />
            <Tabs.Screen name="team" />
            <Tabs.Screen name="assistant" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}
