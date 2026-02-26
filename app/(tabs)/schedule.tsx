import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../src/store/store';
import { addMessage, setIsThinking } from '../../src/store/slices/aiSlice';
import { GradientBackground } from '../../src/components/atoms/GradientBackground';
import { AIChatInterface } from '../../src/components/organisms/AIChatInterface';
import { initialChatMessages, scheduleSuggestions } from '../../src/constants/mockData';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { ChatMessage } from '../../src/types';

const aiResponses: Record<string, string> = {
    'schedule': "I found 3 optimal time slots for your meeting. Based on your team's energy patterns and timezone distribution, I recommend Tuesday at 10 AM UTC — it scores 92% on fairness and 87% on energy optimization. Would you like me to send invites?",
    'focus': "I've analyzed your calendar and found 2 available focus blocks this week:\n\n📌 Wednesday 2-5 PM (3 hours)\n📌 Friday 9 AM - 12 PM (3 hours)\n\nYour energy is predicted to be highest during the Friday slot. Shall I block it off?",
    'conflict': "I detected 1 scheduling conflict:\n\n⚠️ 'Sprint Planning' and 'Design Review' overlap by 30 minutes on Thursday.\n\nI can suggest 3 alternative times that work for all attendees. Want me to show them?",
    'energy': "Your energy forecast for today:\n\n🌅 Morning (6-10): Medium (5/10)\n☀️ Midday (10-2): High (7/10)\n🌆 Evening (5-9): Peak (9/10) ⚡\n🌙 Night (9+): Low (3/10)\n\nAs a Wolf chronotype, your creative peak is in the evening. I recommend scheduling brainstorming sessions after 5 PM.",
    'default': "I understand you'd like help with scheduling. I can:\n\n• Find optimal meeting times for your team\n• Protect focus time blocks\n• Resolve scheduling conflicts\n• Analyze your energy patterns\n\nJust tell me what you need in plain English!",
};

function getAIResponse(userMessage: string): string {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('schedule') || lowerMsg.includes('meeting') || lowerMsg.includes('best time')) return aiResponses['schedule'];
    if (lowerMsg.includes('focus') || lowerMsg.includes('deep work') || lowerMsg.includes('block')) return aiResponses['focus'];
    if (lowerMsg.includes('conflict') || lowerMsg.includes('overlap')) return aiResponses['conflict'];
    if (lowerMsg.includes('energy') || lowerMsg.includes('tired') || lowerMsg.includes('productive')) return aiResponses['energy'];
    return aiResponses['default'];
}

export default function ScheduleScreen() {
    const dispatch = useDispatch();
    const { chatMessages, isThinking } = useSelector((state: RootState) => state.ai);
    const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
    const [thinking, setThinking] = useState(false);

    const quickReplies = messages.length <= 1
        ? ['Schedule a meeting', 'Find best time for team', 'Check my energy', 'Show conflicts']
        : [];

    const handleSend = useCallback((text: string) => {
        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            text,
            sender: 'user',
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setThinking(true);

        setTimeout(() => {
            const aiMsg: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                text: getAIResponse(text),
                sender: 'ai',
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setThinking(false);
        }, 1500 + Math.random() * 1000);
    }, []);

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <LinearGradient
                    colors={[colors.dark.bg, 'transparent']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerEmoji}>🤖</Text>
                        <View>
                            <Text style={styles.headerTitle}>AI Scheduler</Text>
                            <Text style={styles.headerSubtitle}>Powered by TimeSync AI</Text>
                        </View>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: colors.status.success }]} />
                </LinearGradient>

                {/* Chat Interface */}
                <AIChatInterface
                    messages={messages}
                    onSend={handleSend}
                    isThinking={thinking}
                    quickReplies={quickReplies}
                />
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glass.border },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    headerEmoji: { fontSize: 28 },
    headerTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xl, color: '#FFF' },
    headerSubtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.status.success },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
});
