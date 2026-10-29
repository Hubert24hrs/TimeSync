import { router } from 'expo-router';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { ChatPanel } from '../../src/components/Chat';
import { EnergyCurve } from '../../src/components/Energy';
import { askAssistant } from '../../src/data/api';
import { toParticipant } from '../../src/data/demo';
import { computeAnalytics, formatPeakWindows, localHour, peakHours } from '../../src/engine';
import { useLayout } from '../../src/hooks/useLayout';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useMe, useWorkspace } from '../../src/hooks/useWorkspace';
import { addMessage, clearChat, setIsThinking } from '../../src/store/slices/aiSlice';
import { useAppDispatch, useAppSelector } from '../../src/store/store';
import { spacing, useTheme } from '../../src/theme';
import type { ChatMessage } from '../../src/types';
import { Screen } from '../../src/ui/Screen';
import { Badge, Button, Card, IconButton, Segmented, Stat, Txt } from '../../src/ui/primitives';

const WELCOME: ChatMessage = {
    id: 'welcome',
    sender: 'ai',
    timestamp: new Date(0).toISOString(),
    text: "Hi! I'm your scheduling assistant. I can find the fairest time across your team's zones, check energy peaks, spot conflicts, protect focus time, and flag holidays or clock changes.",
    quickReplies: ['Best time for the team', 'When is my energy peak?', 'Any conflicts?', 'Find focus time', 'Upcoming holidays'],
};

function Insights() {
    const { c } = useTheme();
    const me = useMe();
    const { bookings } = useWorkspace();
    const { contentWidth } = useLayout();
    const { can } = useSubscription();
    const stats = useMemo(() => computeAnalytics(bookings, me ? [toParticipant(me)] : []), [bookings, me]);
    if (!me) return null;
    const peaks = peakHours(me.chronotype);
    const peakMeetings = bookings.filter((b) => b.status !== 'cancelled' && peaks.includes(DateTime.fromISO(b.start, { zone: me.timezone }).hour)).length;
    const recs = [
        (stats.afterHoursMinutes[me.id] ?? 0) > 120 ? `You spent ${Math.round((stats.afterHoursMinutes[me.id] ?? 0) / 60)}h in meetings outside working hours. Add a buffer or a later start on your evening schedule.` : 'After-hours load is healthy — keep rotating late calls across the team.',
        peakMeetings > 3 ? `${peakMeetings} meetings landed in your peak (${formatPeakWindows(me.chronotype)}). Block one peak slot a day for deep work.` : 'Your peak hours are mostly protected. 👍',
        stats.noShows > 0 ? `${stats.noShows} no-show${stats.noShows > 1 ? 's' : ''} recently — reminders are on; consider requiring a phone number on intake forms.` : 'No no-shows recently.',
    ];
    return (
        <View style={{ gap: spacing.md }}>
            <Card style={{ gap: spacing.sm }}>
                <Txt variant="overline" tone="muted">
                    Energy · {me.chronotype}
                </Txt>
                <EnergyCurve chronotype={me.chronotype} hour={localHour(Date.now(), me.timezone)} width={Math.min(contentWidth - 64, 700)} height={110} />
                <Txt variant="caption" tone="secondary">
                    Peak {formatPeakWindows(me.chronotype)} local. TimeSync ranks suggestions by everyone’s energy at the meeting time.
                </Txt>
            </Card>
            <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
                <Stat label="Meetings (60 days)" value={String(stats.meetingsBooked)} icon="calendar-outline" />
                <Stat label="Avg fairness" value={stats.averageFairness !== null ? String(stats.averageFairness) : '—'} icon="scale-outline" tone={c.success} />
                <Stat label="No-shows" value={String(stats.noShows)} icon="person-remove-outline" tone={c.warning} />
            </Card>
            <Card style={{ gap: spacing.md }}>
                <Txt variant="overline" tone="muted">
                    Recommendations
                </Txt>
                {recs.map((r) => (
                    <Txt key={r} tone="secondary">
                        • {r}
                    </Txt>
                ))}
            </Card>
            <Button title={can('analytics') ? 'Open analytics' : 'Unlock analytics'} icon="stats-chart-outline" variant="secondary" onPress={() => router.push(can('analytics') ? '/analytics' : '/paywall')} />
        </View>
    );
}

export default function Assistant() {
    const dispatch = useAppDispatch();
    const me = useMe();
    const { chatMessages, isThinking } = useAppSelector((s) => s.ai);
    const mode = useAppSelector((s) => s.auth.mode);
    const { can } = useSubscription();
    const [tab, setTab] = useState<'chat' | 'insights'>('chat');
    const messages = chatMessages.length ? chatMessages : [WELCOME];
    const usesModel = mode === 'cloud' && can('ai_assistant');

    const send = async (text: string) => {
        const user: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text, timestamp: new Date().toISOString() };
        dispatch(addMessage(user));
        dispatch(setIsThinking(true));
        try {
            const reply = await askAssistant(text, [...chatMessages, user]);
            dispatch(addMessage({ id: `a-${Date.now()}`, sender: 'ai', timestamp: new Date().toISOString(), ...reply }));
        } catch (e) {
            dispatch(addMessage({ id: `a-${Date.now()}`, sender: 'ai', timestamp: new Date().toISOString(), text: e instanceof Error ? e.message : 'Something went wrong.' }));
        } finally {
            dispatch(setIsThinking(false));
        }
    };

    return (
        <Screen
            title="Assistant"
            tabSpacing
            scroll={tab === 'insights'}
            right={tab === 'chat' && chatMessages.length ? <IconButton icon="refresh" label="Clear chat" onPress={() => dispatch(clearChat())} /> : undefined}
        >
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md }}>
                <View style={{ flex: 1 }}>
                    <Segmented value={tab} onChange={setTab} options={[{ value: 'chat', label: 'Chat' }, { value: 'insights', label: 'Insights' }]} />
                </View>
                <Badge tone={usesModel ? 'primary' : 'neutral'} icon={usesModel ? 'sparkles' : 'hardware-chip-outline'} label={usesModel ? 'AI' : 'On-device'} />
            </View>
            {tab === 'chat' ? (
                <ChatPanel
                    messages={messages}
                    thinking={isThinking}
                    zone={me?.timezone ?? 'UTC'}
                    onSend={send}
                    footer={
                        !can('ai_assistant') ? (
                            <Txt variant="caption" tone="muted" style={{ marginBottom: spacing.xs }}>
                                Free plan uses the on-device assistant. Pro adds the AI model for open-ended questions.
                            </Txt>
                        ) : null
                    }
                />
            ) : (
                <Insights />
            )}
        </Screen>
    );
}
