import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage } from '../../types';
import { colors } from '../../theme/colors';
import { fontFamilies, fontSizes } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface AIChatInterfaceProps {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    isThinking: boolean;
    quickReplies?: string[];
}

function ThinkingIndicator() {
    return (
        <View style={styles.thinkingContainer}>
            <LinearGradient
                colors={[colors.dark.card, colors.dark.elevated]}
                style={styles.aiBubble}
            >
                <View style={styles.thinkingDots}>
                    {[0, 1, 2].map((i) => (
                        <Animated.View
                            key={i}
                            entering={FadeIn.delay(i * 200).duration(400)}
                            style={styles.dot}
                        >
                            <View style={[styles.dotInner]} />
                        </Animated.View>
                    ))}
                </View>
                <Text style={styles.thinkingText}>AI is thinking...</Text>
            </LinearGradient>
        </View>
    );
}

export function AIChatInterface({ messages, onSend, isThinking, quickReplies = [] }: AIChatInterfaceProps) {
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<ScrollView>(null);

    const handleSend = () => {
        if (inputText.trim()) {
            onSend(inputText.trim());
            setInputText('');
        }
    };

    const handleQuickReply = (reply: string) => {
        onSend(reply);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                ref={scrollRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg) => (
                    <Animated.View
                        key={msg.id}
                        entering={SlideInRight.duration(300)}
                        style={[styles.messageRow, msg.sender === 'user' ? styles.userRow : styles.aiRow]}
                    >
                        {msg.sender === 'ai' && (
                            <View style={styles.aiAvatar}>
                                <Text style={styles.aiAvatarText}>🤖</Text>
                            </View>
                        )}
                        <LinearGradient
                            colors={msg.sender === 'user'
                                ? [colors.primary.main, colors.primary.dark]
                                : [colors.dark.card, colors.dark.elevated]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.bubble,
                                msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                            ]}
                        >
                            <Text style={styles.messageText}>{msg.text}</Text>
                        </LinearGradient>
                    </Animated.View>
                ))}
                {isThinking && <ThinkingIndicator />}
            </ScrollView>

            {quickReplies.length > 0 && !isThinking && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRepliesContainer} contentContainerStyle={styles.quickRepliesContent}>
                    {quickReplies.map((reply, i) => (
                        <Pressable key={i} onPress={() => handleQuickReply(reply)}>
                            <LinearGradient
                                colors={['rgba(108,92,231,0.2)', 'rgba(108,92,231,0.1)']}
                                style={styles.quickReply}
                            >
                                <Text style={styles.quickReplyText}>{reply}</Text>
                            </LinearGradient>
                        </Pressable>
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Ask AI to schedule..."
                    placeholderTextColor={colors.glass.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    multiline
                />
                <Pressable onPress={handleSend} style={styles.sendButton}>
                    <LinearGradient
                        colors={inputText.trim() ? [colors.primary.main, colors.primary.light] : [colors.dark.surface, colors.dark.surface]}
                        style={styles.sendGradient}
                    >
                        <Text style={styles.sendIcon}>↑</Text>
                    </LinearGradient>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    messagesContainer: { flex: 1 },
    messagesContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    messageRow: { flexDirection: 'row', marginBottom: spacing.md, maxWidth: '85%' },
    userRow: { alignSelf: 'flex-end' },
    aiRow: { alignSelf: 'flex-start', gap: spacing.sm },
    aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.dark.elevated, alignItems: 'center', justifyContent: 'center' },
    aiAvatarText: { fontSize: 18 },
    bubble: { borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.glass.border },
    userBubble: { borderTopRightRadius: 4 },
    aiBubble: { borderTopLeftRadius: 4 },
    messageText: { color: '#FFF', fontFamily: fontFamilies.primary, fontSize: fontSizes.md, lineHeight: 22 },
    thinkingContainer: { flexDirection: 'row', alignSelf: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
    thinkingDots: { flexDirection: 'row', gap: 6, marginBottom: spacing.xs },
    dot: {},
    dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary.light },
    thinkingText: { color: colors.glass.textMuted, fontFamily: fontFamilies.primary, fontSize: fontSizes.xs },
    quickRepliesContainer: { maxHeight: 50, marginBottom: spacing.sm },
    quickRepliesContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    quickReply: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, borderWidth: 1, borderColor: colors.primary.main + '40' },
    quickReplyText: { color: colors.primary.light, fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glass.border, backgroundColor: colors.dark.bg + 'DD' },
    textInput: { flex: 1, backgroundColor: colors.dark.card, borderRadius: borderRadius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, color: '#FFF', fontFamily: fontFamilies.primary, fontSize: fontSizes.md, maxHeight: 100, borderWidth: 1, borderColor: colors.glass.border },
    sendButton: { marginBottom: 4 },
    sendGradient: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    sendIcon: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});
