import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { cityFromZone, isValidTimeZone, utcOffsetLabel } from '../engine';
import { radius, spacing, type, useTheme } from '../theme';
import { Button, Txt } from '../ui/primitives';

const COMMON_ZONES = [
    'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/Mexico_City', 'America/New_York',
    'America/Toronto', 'America/Bogota', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'Atlantic/Reykjavik', 'Europe/London', 'Europe/Lisbon',
    'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Athens',
    'Europe/Istanbul', 'Europe/Moscow', 'Africa/Lagos', 'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Nairobi', 'Asia/Jerusalem', 'Asia/Riyadh',
    'Asia/Dubai', 'Asia/Tehran', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Singapore',
    'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Manila', 'Asia/Seoul', 'Asia/Tokyo', 'Australia/Perth', 'Australia/Adelaide', 'Australia/Sydney',
    'Pacific/Auckland', 'UTC',
];

/** Button that opens a searchable time-zone list (accepts any valid IANA zone typed in). */
export function ZonePicker({ value, onChange, label = 'Time zone' }: { value: string; onChange: (zone: string) => void; label?: string }) {
    const { c } = useTheme();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const results = useMemo(() => {
        const q = query.trim().toLowerCase().replace(/\s+/g, '_');
        const list = q ? COMMON_ZONES.filter((z) => z.toLowerCase().includes(q)) : COMMON_ZONES;
        const typed = query.trim();
        return typed && isValidTimeZone(typed) && !list.includes(typed) ? [typed, ...list] : list;
    }, [query]);
    return (
        <>
            <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Ionicons name="globe-outline" size={18} color={c.primary} />
                <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{cityFromZone(value)}</Txt>
                    <Txt variant="caption" tone="muted">
                        {value} · {utcOffsetLabel(value)}
                    </Txt>
                </View>
                <Ionicons name="chevron-down" size={18} color={c.textMuted} />
            </Pressable>
            <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
                <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: c.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '80%', padding: spacing.lg, gap: spacing.md, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
                        <Txt variant="h2">{label}</Txt>
                        <TextInput
                            autoFocus
                            accessibilityLabel="Search time zones"
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search a city or type an IANA zone"
                            placeholderTextColor={c.textMuted}
                            autoCapitalize="none"
                            style={[type.body, { color: c.text, backgroundColor: c.card, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: 12 }]}
                        />
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {results.map((z) => (
                                <Pressable
                                    key={z}
                                    accessibilityRole="button"
                                    onPress={() => {
                                        onChange(z);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}
                                >
                                    <Txt tone={z === value ? 'primary' : 'default'}>{z.replace(/_/g, ' ')}</Txt>
                                    <Txt variant="mono" tone="muted">
                                        {utcOffsetLabel(z)}
                                    </Txt>
                                </Pressable>
                            ))}
                        </ScrollView>
                        <Button title="Close" variant="secondary" onPress={() => setOpen(false)} />
                    </View>
                </View>
            </Modal>
        </>
    );
}
