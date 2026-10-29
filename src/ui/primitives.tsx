import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, type ReactNode } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type TextProps,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { haptics } from '../lib/haptics';
import { gradients, radius, spacing, type, useTheme, type ThemeColors } from '../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

// ───────────────────────────── Text ─────────────────────────────
type Variant = keyof typeof type;
type Tone = 'default' | 'secondary' | 'muted' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'onAccent';

const toneColor = (tone: Tone, c: ThemeColors) =>
    ({ default: c.text, secondary: c.textSecondary, muted: c.textMuted, primary: c.primary, accent: c.accent, success: c.success, warning: c.warning, danger: c.danger, onAccent: c.textOnAccent })[tone];

export function Txt({ variant = 'body', tone = 'default', style, ...rest }: TextProps & { variant?: Variant; tone?: Tone }) {
    const { c } = useTheme();
    return <Text {...rest} style={[type[variant], { color: toneColor(tone, c) }, style]} />;
}

// ───────────────────────────── Pressable with spring scale ─────────────────────────────
const APressable = Animated.createAnimatedComponent(Pressable);

export function PressScale({ onPress, disabled, children, style, accessibilityLabel, accessibilityRole = 'button', haptic = true }: {
    onPress?: () => void;
    disabled?: boolean;
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
    accessibilityRole?: 'button' | 'link' | 'tab' | 'radio' | 'checkbox';
    haptic?: boolean;
}) {
    const scale = useSharedValue(1);
    const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
        <APressable
            accessibilityRole={accessibilityRole}
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: !!disabled }}
            disabled={disabled}
            onPressIn={() => (scale.value = withSpring(0.97, { damping: 20, stiffness: 400 }))}
            onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))}
            onPress={() => {
                if (haptic) haptics.tap();
                onPress?.();
            }}
            style={[animated, style, disabled && { opacity: 0.5 }]}
        >
            {children}
        </APressable>
    );
}

// ───────────────────────────── Card ─────────────────────────────
export function Card({ children, style, onPress, accent, padded = true, accessibilityLabel }: {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    accent?: string;
    padded?: boolean;
    accessibilityLabel?: string;
}) {
    const { c } = useTheme();
    const body = (
        <View style={[{ backgroundColor: c.card, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: radius.lg, overflow: 'hidden' }, padded && { padding: spacing.lg }, style]}>
            {accent ? <LinearGradient colors={[accent, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: 0.12 }]} pointerEvents="none" /> : null}
            {children}
        </View>
    );
    return onPress ? (
        <PressScale onPress={onPress} accessibilityLabel={accessibilityLabel}>
            {body}
        </PressScale>
    ) : (
        body
    );
}

// ───────────────────────────── Buttons ─────────────────────────────
export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, size = 'md', fullWidth, style, accessibilityLabel }: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    icon?: IconName;
    loading?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}) {
    const { c } = useTheme();
    const pad = size === 'sm' ? { paddingVertical: 8, paddingHorizontal: 14 } : size === 'lg' ? { paddingVertical: 16, paddingHorizontal: 24 } : { paddingVertical: 12, paddingHorizontal: 18 };
    const fg = variant === 'primary' || variant === 'danger' ? c.textOnAccent : variant === 'ghost' ? c.primary : c.text;
    const content = (
        <View style={[styles.row, { justifyContent: 'center', gap: spacing.sm }, pad]}>
            {loading ? <ActivityIndicator color={fg} size="small" /> : icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
            <Text style={[type.label, { color: fg, fontSize: size === 'lg' ? 16 : size === 'sm' ? 13 : 14 }]}>{title}</Text>
        </View>
    );
    return (
        <PressScale onPress={onPress} disabled={disabled || loading} accessibilityLabel={accessibilityLabel ?? title} style={[fullWidth && { alignSelf: 'stretch' }, style]}>
            {variant === 'primary' ? (
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.pill }}>
                    {content}
                </LinearGradient>
            ) : (
                <View
                    style={{
                        borderRadius: radius.pill,
                        backgroundColor: variant === 'danger' ? c.danger : variant === 'secondary' ? c.card : 'transparent',
                        borderWidth: variant === 'secondary' ? 1 : 0,
                        borderColor: c.borderStrong,
                    }}
                >
                    {content}
                </View>
            )}
        </PressScale>
    );
}

export function IconButton({ icon, onPress, label, size = 20, tone, style }: { icon: IconName; onPress: () => void; label: string; size?: number; tone?: string; style?: StyleProp<ViewStyle> }) {
    const { c } = useTheme();
    return (
        <PressScale onPress={onPress} accessibilityLabel={label} style={[{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, style]}>
            <Ionicons name={icon} size={size} color={tone ?? c.text} />
        </PressScale>
    );
}

// ───────────────────────────── Chips, badges ─────────────────────────────
export function Chip({ label, selected, onPress, icon, color }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; color?: string }) {
    const { c } = useTheme();
    const tint = color ?? c.primary;
    return (
        <PressScale onPress={onPress} accessibilityRole="radio" accessibilityLabel={label} haptic={!!onPress}>
            <View style={[styles.row, { gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: selected ? tint : c.border, backgroundColor: selected ? `${tint}26` : c.card }]}>
                {icon ? <Ionicons name={icon} size={14} color={selected ? tint : c.textSecondary} /> : null}
                <Text style={[type.label, { color: selected ? tint : c.textSecondary }]}>{label}</Text>
            </View>
        </PressScale>
    );
}

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent'; icon?: IconName }) {
    const { c } = useTheme();
    const map = {
        neutral: [c.card, c.textSecondary],
        primary: [c.primarySoft, c.primary],
        success: [c.successSoft, c.success],
        warning: [c.warningSoft, c.warning],
        danger: [c.dangerSoft, c.danger],
        info: [c.accentSoft, c.info],
        accent: [c.accentSoft, c.accent],
    } as const;
    const [bg, fg] = map[tone];
    return (
        <View style={[styles.row, { gap: 4, alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }]}>
            {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
            <Text style={[type.caption, { color: fg, fontFamily: type.label.fontFamily }]}>{label}</Text>
        </View>
    );
}

/** Fairness / energy score pill. */
export function ScoreBadge({ kind, value }: { kind: 'fairness' | 'energy'; value: number }) {
    const tone = value >= 85 ? 'success' : value >= 65 ? 'warning' : 'danger';
    return <Badge tone={tone} icon={kind === 'fairness' ? 'scale-outline' : 'flash-outline'} label={`${kind === 'fairness' ? 'Fair' : 'Energy'} ${value}`} />;
}

// ───────────────────────────── Skeleton ─────────────────────────────
export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
    const { c } = useTheme();
    const opacity = useSharedValue(0.5);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1);
    }, [opacity]);
    const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View accessibilityLabel="Loading" style={[{ height, width, borderRadius: radius.sm, backgroundColor: c.skeleton }, animated, style]} />;
}

// ───────────────────────────── Inputs ─────────────────────────────
export function Field({ label, hint, error, style, ...input }: TextInputProps & { label: string; hint?: string; error?: string; style?: StyleProp<TextStyle> }) {
    const { c } = useTheme();
    return (
        <View style={{ gap: 6 }}>
            <Txt variant="label" tone="secondary">
                {label}
            </Txt>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={c.textMuted}
                {...input}
                style={[type.body, { color: c.text, backgroundColor: c.card, borderWidth: 1, borderColor: error ? c.danger : c.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, minHeight: input.multiline ? 88 : undefined, textAlignVertical: input.multiline ? 'top' : 'center' }, style]}
            />
            {error ? (
                <Txt variant="caption" tone="danger">
                    {error}
                </Txt>
            ) : hint ? (
                <Txt variant="caption" tone="muted">
                    {hint}
                </Txt>
            ) : null}
        </View>
    );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    const { c } = useTheme();
    return (
        <View accessibilityRole="tablist" style={[styles.row, { backgroundColor: c.card, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: c.border }]}>
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <Pressable
                        key={o.value}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                            haptics.select();
                            onChange(o.value);
                        }}
                        style={{ flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center', backgroundColor: active ? c.primarySoft : 'transparent' }}
                    >
                        <Text style={[type.label, { color: active ? c.primary : c.textSecondary }]}>{o.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export function ListRow({ icon, iconColor, title, subtitle, value, onPress, toggle, onToggle, danger, last }: {
    icon?: IconName;
    iconColor?: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    toggle?: boolean;
    onToggle?: (v: boolean) => void;
    danger?: boolean;
    last?: boolean;
}) {
    const { c } = useTheme();
    const body = (
        <View style={[styles.row, { gap: spacing.md, paddingVertical: 14, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
            {icon ? (
                <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${iconColor ?? c.primary}22` }}>
                    <Ionicons name={icon} size={18} color={iconColor ?? c.primary} />
                </View>
            ) : null}
            <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" tone={danger ? 'danger' : 'default'}>
                    {title}
                </Txt>
                {subtitle ? (
                    <Txt variant="caption" tone="muted">
                        {subtitle}
                    </Txt>
                ) : null}
            </View>
            {value ? (
                <Txt variant="label" tone="muted">
                    {value}
                </Txt>
            ) : null}
            {onToggle ? (
                <Switch accessibilityLabel={title} value={!!toggle} onValueChange={(v) => {
                    haptics.select();
                    onToggle(v);
                }} trackColor={{ true: c.primary, false: c.borderStrong }} thumbColor="#FFFFFF" />
            ) : onPress ? (
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            ) : null}
        </View>
    );
    return onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { haptics.tap(); onPress(); }}>
            {body}
        </Pressable>
    ) : (
        body
    );
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
    return (
        <View style={[styles.row, { justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md }, style]}>
            <Txt variant="h2" accessibilityRole="header">
                {title}
            </Txt>
            {action && onAction ? (
                <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10}>
                    <Txt variant="label" tone="primary">
                        {action}
                    </Txt>
                </Pressable>
            ) : null}
        </View>
    );
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body?: string; action?: string; onAction?: () => void }) {
    const { c } = useTheme();
    return (
        <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft }}>
                <Ionicons name={icon} size={26} color={c.primary} />
            </View>
            <Txt variant="h3">{title}</Txt>
            {body ? (
                <Txt tone="muted" style={{ textAlign: 'center', maxWidth: 320 }}>
                    {body}
                </Txt>
            ) : null}
            {action && onAction ? <Button title={action} onPress={onAction} size="sm" style={{ marginTop: spacing.sm }} /> : null}
        </View>
    );
}

const AVATAR_COLORS = ['#7C5CFF', '#22D3EE', '#FF5CAA', '#FFC857', '#2EE6A6', '#5EA8FF', '#FF6B81'];

export function Avatar({ name, id, size = 40, status }: { name: string; id?: string; size?: number; status?: 'online' | 'away' | 'offline' }) {
    const { c } = useTheme();
    const key = id ?? name;
    const color = AVATAR_COLORS[[...key].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
    const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    return (
        <View accessibilityLabel={name} style={{ width: size, height: size }}>
            <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}33`, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[type.label, { color, fontSize: size * 0.36 }]}>{initials}</Text>
            </View>
            {status ? (
                <View style={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.3, height: size * 0.3, borderRadius: size, borderWidth: 2, borderColor: c.bg, backgroundColor: status === 'online' ? c.success : status === 'away' ? c.warning : c.textMuted }} />
            ) : null}
        </View>
    );
}

export function Stat({ label, value, icon, tone }: { label: string; value: string; icon?: IconName; tone?: string }) {
    const { c } = useTheme();
    return (
        <View style={{ gap: 4, flex: 1, minWidth: 120 }}>
            <View style={[styles.row, { gap: 6 }]}>
                {icon ? <Ionicons name={icon} size={14} color={tone ?? c.textMuted} /> : null}
                <Txt variant="caption" tone="muted">
                    {label}
                </Txt>
            </View>
            <Text style={[type.clock, { color: tone ?? c.text, fontSize: 24 }]}>{value}</Text>
        </View>
    );
}

export const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
});
