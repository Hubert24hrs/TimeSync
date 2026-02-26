import React from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store/store';
import { setTheme, setNotifications, setBiometrics, toggleCalendarIntegration } from '../src/store/slices/settingsSlice';
import { GradientBackground } from '../src/components/atoms/GradientBackground';
import { HolographicCard } from '../src/components/atoms/HolographicCard';
import { GlassButton } from '../src/components/atoms/GlassButton';
import { colors } from '../src/theme/colors';
import { fontFamilies, fontSizes } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme/spacing';
import { ThemeMode } from '../src/theme';

export default function SettingsScreen() {
    const dispatch = useDispatch();
    const settings = useSelector((state: RootState) => state.settings);

    const themeOptions: { label: string; value: ThemeMode; emoji: string }[] = [
        { label: 'Dark', value: 'dark', emoji: '🌙' },
        { label: 'Light', value: 'light', emoji: '☀️' },
        { label: 'Auto', value: 'auto', emoji: '🔄' },
    ];

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} hitSlop={12}>
                            <Text style={styles.backButton}>← Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Settings</Text>
                        <View style={{ width: 60 }} />
                    </View>

                    {/* Appearance */}
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <HolographicCard>
                        <Text style={styles.settingLabel}>Theme</Text>
                        <View style={styles.themeRow}>
                            {themeOptions.map((opt) => (
                                <Pressable key={opt.value} onPress={() => dispatch(setTheme(opt.value))}>
                                    <View style={[styles.themeOption, settings.theme === opt.value && styles.themeOptionActive]}>
                                        <Text style={styles.themeEmoji}>{opt.emoji}</Text>
                                        <Text style={[styles.themeLabel, settings.theme === opt.value && styles.themeLabelActive]}>
                                            {opt.label}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </HolographicCard>

                    {/* Notifications */}
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <HolographicCard>
                        <View style={styles.settingRow}>
                            <View>
                                <Text style={styles.settingLabel}>Push Notifications</Text>
                                <Text style={styles.settingDesc}>Meeting reminders and AI alerts</Text>
                            </View>
                            <Switch
                                value={settings.notificationsEnabled}
                                onValueChange={(v) => dispatch(setNotifications(v))}
                                trackColor={{ false: colors.dark.surface, true: colors.primary.main + '60' }}
                                thumbColor={settings.notificationsEnabled ? colors.primary.main : colors.glass.textMuted}
                            />
                        </View>
                    </HolographicCard>

                    {/* Security */}
                    <Text style={styles.sectionTitle}>Security</Text>
                    <HolographicCard>
                        <View style={styles.settingRow}>
                            <View>
                                <Text style={styles.settingLabel}>Biometric Unlock</Text>
                                <Text style={styles.settingDesc}>Use Face ID or fingerprint</Text>
                            </View>
                            <Switch
                                value={settings.biometricsEnabled}
                                onValueChange={(v) => dispatch(setBiometrics(v))}
                                trackColor={{ false: colors.dark.surface, true: colors.secondary.main + '60' }}
                                thumbColor={settings.biometricsEnabled ? colors.secondary.main : colors.glass.textMuted}
                            />
                        </View>
                    </HolographicCard>

                    {/* Calendar Integrations */}
                    <Text style={styles.sectionTitle}>Integrations</Text>
                    {settings.calendarIntegrations.map((integration) => (
                        <HolographicCard key={integration.provider} style={styles.integrationCard}>
                            <View style={styles.settingRow}>
                                <View>
                                    <Text style={styles.settingLabel}>{integration.provider}</Text>
                                    <Text style={styles.settingDesc}>
                                        {integration.connected ? '✅ Connected' : '⚪ Not connected'}
                                    </Text>
                                </View>
                                <GlassButton
                                    title={integration.connected ? 'Disconnect' : 'Connect'}
                                    onPress={() => dispatch(toggleCalendarIntegration(integration.provider))}
                                    variant={integration.connected ? 'ghost' : 'primary'}
                                    size="sm"
                                />
                            </View>
                        </HolographicCard>
                    ))}

                    {/* About */}
                    <Text style={styles.sectionTitle}>About</Text>
                    <HolographicCard>
                        <View style={styles.aboutRow}>
                            <Text style={styles.aboutLabel}>Version</Text>
                            <Text style={styles.aboutValue}>1.0.0</Text>
                        </View>
                        <View style={styles.aboutRow}>
                            <Text style={styles.aboutLabel}>Build</Text>
                            <Text style={styles.aboutValue}>2026.02.26</Text>
                        </View>
                    </HolographicCard>

                    <View style={{ height: spacing.huge }} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    backButton: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: colors.primary.light },
    title: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxl, color: '#FFF' },
    sectionTitle: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.md, color: colors.glass.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.md },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { fontFamily: fontFamilies.primarySemiBold, fontSize: fontSizes.lg, color: '#FFF', marginBottom: 2 },
    settingDesc: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    themeRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    themeOption: { alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.glass.border, backgroundColor: colors.dark.surface },
    themeOptionActive: { borderColor: colors.primary.main, backgroundColor: colors.primary.main + '15' },
    themeEmoji: { fontSize: 24, marginBottom: spacing.xs },
    themeLabel: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.glass.textMuted },
    themeLabelActive: { color: colors.primary.light },
    integrationCard: { marginBottom: spacing.sm },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
    aboutLabel: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted },
    aboutValue: { fontFamily: fontFamilies.mono, fontSize: fontSizes.md, color: '#FFF' },
});
