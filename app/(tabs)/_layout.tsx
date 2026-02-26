import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
    return (
        <View style={styles.tabItem}>
            <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ),
                tabBarShowLabel: false,
                tabBarActiveTintColor: colors.primary.main,
                tabBarInactiveTintColor: colors.glass.textMuted,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Home" emoji="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Schedule" emoji="🤖" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="team"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Team" emoji="🌍" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="insights"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Insights" emoji="⚡" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon label="Profile" emoji="👤" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
        height: 80,
        paddingTop: 8,
        elevation: 0,
    },
    tabItem: { alignItems: 'center', gap: 2 },
    tabEmoji: { fontSize: 22, opacity: 0.5 },
    tabEmojiActive: { opacity: 1, fontSize: 24 },
    tabLabel: { fontFamily: fontFamilies.primary, fontSize: 10, color: colors.glass.textMuted },
    tabLabelActive: { fontFamily: fontFamilies.primarySemiBold, color: colors.primary.light },
});
