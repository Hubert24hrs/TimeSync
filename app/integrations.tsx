import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FeatureGate } from '../src/components/Monetization';
import { ShareLinkCard } from '../src/components/ShareLink';
import { deleteWebhook, newId, saveWebhook, slackLinkCode } from '../src/data/api';
import { useMe, useWorkspace } from '../src/hooks/useWorkspace';
import { calendarConnectConfigured, finishCalendarConnect, startCalendarConnect, syncCalendars, type CalendarProvider } from '../src/lib/calendarConnect';
import { isBackendConfigured } from '../src/lib/config';
import { haptics } from '../src/lib/haptics';
import { useAppSelector } from '../src/store/store';
import { radius, spacing, useTheme } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Badge, Button, Card, Field, ListRow, SectionHeader, Txt } from '../src/ui/primitives';

const EVENTS = ['booking.created', 'booking.cancelled', 'booking.rescheduled', 'poll.booked'];

export default function Integrations() {
    const { c } = useTheme();
    const me = useMe();
    const mode = useAppSelector((s) => s.auth.mode);
    const { calendars, webhooks, eventTypes } = useWorkspace();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [slackCode, setSlackCode] = useState<string | null>(null);
    const [calStatus, setCalStatus] = useState<string | null>(null);
    const params = useLocalSearchParams<{ code?: string; state?: string }>();
    const qc = useQueryClient();
    const primary = eventTypes.find((e) => e.ownerId === me?.id && e.active);

    // Finish the OAuth round-trip when the provider redirects back here with ?code=…&state=provider.
    useEffect(() => {
        if (!params.code || (params.state !== 'google' && params.state !== 'outlook') || mode !== 'cloud') return;
        setCalStatus('Connecting…');
        finishCalendarConnect(params.state as CalendarProvider, params.code)
            .then(() => {
                setCalStatus('Connected — busy time synced.');
                qc.invalidateQueries({ queryKey: ['workspace'] });
            })
            .catch((e) => setCalStatus(e instanceof Error ? e.message : 'Could not connect'))
            .finally(() => router.setParams({ code: undefined, state: undefined }));
    }, [params.code, params.state, mode, qc]);

    const addHook = async () => {
        setError(null);
        try {
            await saveWebhook({ id: newId(), url: url.trim(), events: EVENTS.slice(0, 3), active: true });
            setUrl('');
            haptics.success();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not add webhook');
        }
    };

    return (
        <Screen title="Integrations" subtitle="Calendars, Slack, webhooks and embeds" back maxWidth={820}>
            <SectionHeader title="Calendars" style={{ marginTop: 0 }} />
            <FeatureGate feature="calendar_sync">
                <Card style={{ paddingVertical: 0 }}>
                    {(['google', 'outlook'] as const).map((p, i) => {
                        const conn = calendars.find((x) => x.provider === p);
                        return (
                            <ListRow
                                key={p}
                                icon={p === 'google' ? 'logo-google' : 'logo-microsoft'}
                                iconColor={p === 'google' ? c.danger : c.info}
                                title={p === 'google' ? 'Google Calendar' : 'Outlook / Microsoft 365'}
                                subtitle={conn ? `${conn.email} · conflict checks on · Meet/Teams links` : mode === 'cloud' ? 'Two-way sync: busy time in, bookings out' : 'Sign in with a real account to connect'}
                                value={conn ? 'Connected' : undefined}
                                onPress={!conn && mode === 'cloud' && calendarConnectConfigured(p) ? () => startCalendarConnect(p) : undefined}
                                last={i === 1}
                            />
                        );
                    })}
                </Card>
                {calendars.length ? <Button title="Sync now" icon="sync-outline" size="sm" variant="ghost" onPress={() => syncCalendars().then(() => qc.invalidateQueries({ queryKey: ['workspace'] }))} style={{ marginTop: spacing.sm }} /> : null}
                {calStatus ? <Txt variant="caption" tone="secondary" style={{ marginTop: spacing.sm }}>{calStatus}</Txt> : null}
                <Txt variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                    {isBackendConfigured
                        ? 'Connecting runs the provider’s OAuth consent; tokens are stored server-side only (see README → Calendar sync).'
                        : 'Calendar sync needs the Supabase backend and Google/Microsoft OAuth apps — see README.'}
                </Txt>
            </FeatureGate>

            <SectionHeader title="Slack" />
            <FeatureGate feature="slack">
                <Card style={{ gap: spacing.sm }}>
                    <Txt tone="secondary">Use /timesync today, /timesync find and /timesync links from Slack.</Txt>
                    {slackCode ? (
                        <View style={{ backgroundColor: c.bgAlt, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }}>
                            <Txt variant="caption" tone="muted">
                                Run this in Slack within 15 minutes:
                            </Txt>
                            <Txt variant="mono" selectable numberOfLines={3}>
                                /timesync link {slackCode}
                            </Txt>
                            <Button title="Copy command" size="sm" icon="copy-outline" onPress={() => Clipboard.setStringAsync(`/timesync link ${slackCode}`)} />
                        </View>
                    ) : (
                        <Button title="Connect Slack" icon="logo-slack" size="sm" onPress={async () => setSlackCode(await slackLinkCode())} />
                    )}
                </Card>
            </FeatureGate>

            <SectionHeader title="Webhooks & Zapier" />
            <FeatureGate feature="webhooks">
                <Card style={{ gap: spacing.md }}>
                    <Txt variant="caption" tone="muted">
                        We POST signed JSON (X-TimeSync-Signature: sha256 HMAC) on booking events. Paste a Zapier or Make “catch hook” URL.
                    </Txt>
                    {webhooks.map((w) => (
                        <View key={w.id} style={{ gap: 6, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border }}>
                            <Txt variant="mono" numberOfLines={1}>
                                {w.url}
                            </Txt>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                {w.events.map((e) => (
                                    <Badge key={e} label={e} />
                                ))}
                                <Button title="Remove" size="sm" variant="ghost" onPress={() => deleteWebhook(w.id)} />
                            </View>
                        </View>
                    ))}
                    <Field label="Webhook URL" value={url} onChangeText={setUrl} placeholder="https://hooks.zapier.com/…" autoCapitalize="none" keyboardType="url" error={error ?? undefined} />
                    <Button title="Add webhook" icon="add" size="sm" disabled={!url.startsWith('https://')} onPress={addHook} />
                </Card>
            </FeatureGate>

            <SectionHeader title="Embed & QR" />
            {me && primary ? <ShareLinkCard username={me.username} slug={primary.slug} title={primary.title} /> : <Txt tone="muted">Activate an event type to get embed code.</Txt>}
        </Screen>
    );
}
