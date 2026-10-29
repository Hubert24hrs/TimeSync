import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { haptics } from '../lib/haptics';
import { radius, spacing, type, useTheme } from '../theme';
import type { ChatMessage } from '../types';
import { Chip, ScoreBadge, Skeleton, Txt } from '../ui/primitives';

export function ChatPanel({ messages, thinking, zone, onSend, footer }: { messages: ChatMessage[]; thinking: boolean; zone: string; onSend: (text: string) => void; footer?: React.ReactNode }) {
    const { c } = useTheme();
    const [text, setText] = useState('');
    const scroll = useRef<ScrollView>(null);
    const last = messages[messages.length - 1];
    const send = (value: string) => {
        const v = value.trim();
        if (!v || thinking) return;
        haptics.tap();
        onSend(v);
        setText('');
    };
    return (
        <View style={{ flex: 1 }}>
            <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.md, gap: spacing.md }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
                {messages.map((m) => (
                    <Animated.View key={m.id} entering={FadeInDown.duration(250)} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', gap: spacing.sm }}>
                        <View
                            style={{
                                backgroundColor: m.sender === 'user' ? c.primary : c.card,
                                borderColor: c.border,
                                borderWidth: m.sender === 'user' ? 0 : 1,
                                borderRadius: radius.lg,
                                borderBottomRightRadius: m.sender === 'user' ? 4 : radius.lg,
                                borderTopLeftRadius: m.sender === 'ai' ? 4 : radius.lg,
                                padding: spacing.md,
                            }}
                        >
                            <Txt tone={m.sender === 'user' ? 'onAccent' : 'default'} selectable>
                                {m.text}
                            </Txt>
                        </View>
                        {m.suggestions?.map((s) => (
                            <View key={s.start} style={{ backgroundColor: c.card, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, padding: spacing.md, gap: 6 }}>
                                <Txt variant="bodyStrong">{DateTime.fromISO(s.start, { zone }).toFormat('ccc d LLL · h:mm a')}</Txt>
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <ScoreBadge kind="fairness" value={s.fairness} />
                                    <ScoreBadge kind="energy" value={s.energy} />
                                </View>
                            </View>
                        ))}
                    </Animated.View>
                ))}
                {thinking ? (
                    <View style={{ gap: 6, width: '60%' }} accessibilityLabel="Assistant is thinking">
                        <Skeleton height={14} />
                        <Skeleton height={14} width="70%" />
                    </View>
                ) : null}
            </ScrollView>
            {last?.quickReplies?.length && !thinking ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }} style={{ flexGrow: 0 }}>
                    {last.quickReplies.map((q) => (
                        <Chip key={q} label={q} onPress={() => send(q)} />
                    ))}
                </ScrollView>
            ) : null}
            {footer}
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end', paddingVertical: spacing.sm }}>
                <TextInput
                    accessibilityLabel="Message the scheduling assistant"
                    value={text}
                    onChangeText={setText}
                    placeholder="Ask: best time for the team this week?"
                    placeholderTextColor={c.textMuted}
                    multiline
                    maxLength={2000}
                    onSubmitEditing={() => send(text)}
                    style={[type.body, { flex: 1, color: c.text, backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, paddingHorizontal: spacing.lg, paddingVertical: 12, maxHeight: 120 }]}
                />
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send"
                    onPress={() => send(text)}
                    style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? c.primary : c.card, borderWidth: 1, borderColor: c.border }}
                >
                    <Ionicons name="arrow-up" size={22} color={text.trim() ? '#FFF' : c.textMuted} />
                </Pressable>
            </View>
        </View>
    );
}
