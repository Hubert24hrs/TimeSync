import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLayout } from '../hooks/useLayout';
import { gradients, MAX_CONTENT_WIDTH, spacing, useTheme } from '../theme';
import { IconButton, Txt } from './primitives';

interface ScreenProps {
    title?: string;
    subtitle?: string;
    /** Show a back / close button. */
    back?: boolean | 'close';
    right?: ReactNode;
    children: ReactNode;
    scroll?: boolean;
    contentStyle?: StyleProp<ViewStyle>;
    refreshControl?: React.ReactElement<RefreshControlProps>;
    /** Leave room for the floating tab bar + FAB. */
    tabSpacing?: boolean;
    maxWidth?: number;
}

export function Background() {
    const { isDark, c } = useTheme();
    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, overflow: 'hidden' }]} pointerEvents="none">
            <LinearGradient colors={isDark ? gradients.darkBg : gradients.lightBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={{ position: 'absolute', top: -120, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: c.primary, opacity: isDark ? 0.14 : 0.07 }} />
            <View style={{ position: 'absolute', bottom: -140, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: c.accent, opacity: isDark ? 0.08 : 0.05 }} />
        </View>
    );
}

export function Screen({ title, subtitle, back, right, children, scroll = true, contentStyle, refreshControl, tabSpacing = false, maxWidth = MAX_CONTENT_WIDTH }: ScreenProps) {
    const { isWide } = useLayout();
    const header =
        title || back || right ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
                {back ? (
                    <IconButton
                        icon={back === 'close' ? 'close' : 'chevron-back'}
                        label={back === 'close' ? 'Close' : 'Back'}
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                    />
                ) : null}
                <View style={{ flex: 1 }}>
                    {title ? (
                        <Txt variant={back ? 'h2' : 'h1'} accessibilityRole="header" numberOfLines={1}>
                            {title}
                        </Txt>
                    ) : null}
                    {subtitle ? (
                        <Txt tone="muted" numberOfLines={2}>
                            {subtitle}
                        </Txt>
                    ) : null}
                </View>
                {right}
            </View>
        ) : null;

    const inner: StyleProp<ViewStyle> = [{ width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: isWide ? spacing.xxl : spacing.lg, paddingTop: spacing.md }, contentStyle];
    const bottom = tabSpacing && !isWide ? 140 : spacing.xxxl;

    return (
        <SafeAreaView style={{ flex: 1, overflow: 'hidden' }} edges={['top', 'left', 'right']}>
            <Background />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {scroll ? (
                    <ScrollView contentContainerStyle={{ paddingBottom: bottom }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
                        <View style={inner}>
                            {header}
                            {children}
                        </View>
                    </ScrollView>
                ) : (
                    <View style={[inner, { flex: 1, paddingBottom: tabSpacing && !isWide ? 96 : 0 }]}>
                        {header}
                        {children}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export function Grid({ children, columns, gap = spacing.md }: { children: ReactNode; columns?: number; gap?: number }) {
    const layout = useLayout();
    const cols = columns ?? layout.columns;
    const items = React.Children.toArray(children);
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2 }}>
            {items.map((child, i) => (
                <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2, marginBottom: gap }}>
                    {child}
                </View>
            ))}
        </View>
    );
}
