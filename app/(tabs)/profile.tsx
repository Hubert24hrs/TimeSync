import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { ShareLinkCard } from '../../src/components/ShareLink';
import { workweekLabel, cityFromZone } from '../../src/engine';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useMe, useWorkspace } from '../../src/hooks/useWorkspace';
import { signOut } from '../../src/lib/auth';
import { logout } from '../../src/store/slices/authSlice';
import { resetWorkspace } from '../../src/store/slices/workspaceSlice';
import { clearChat } from '../../src/store/slices/aiSlice';
import { useAppDispatch, useAppSelector } from '../../src/store/store';
import { chronotypeColors, spacing, useTheme } from '../../src/theme';
import { Screen } from '../../src/ui/Screen';
import { Avatar, Badge, Card, ListRow, SectionHeader, Txt } from '../../src/ui/primitives';

const TIER_LABEL = { free: 'Free', pro: 'Pro', teams: 'Team' } as const;

export default function Profile() {
    const { c } = useTheme();
    const dispatch = useAppDispatch();
    const me = useMe();
    const mode = useAppSelector((s) => s.auth.mode);
    const { eventTypes, schedules, calendars } = useWorkspace();
    const { tier, can } = useSubscription();
    if (!me) return null;
    const primary = eventTypes.find((e) => e.ownerId === me.id && e.active);

    const leave = async () => {
        if (mode === 'cloud') await signOut();
        dispatch(clearChat());
        dispatch(resetWorkspace());
        dispatch(logout());
        router.replace('/welcome');
    };

    return (
        <Screen title="Profile" tabSpacing>
            <Card accent={chronotypeColors[me.chronotype]} style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
                <Avatar name={me.name} id={me.id} size={64} status="online" />
                <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="h2">{me.name}</Txt>
                    <Txt variant="caption" tone="muted">
                        @{me.username} · {cityFromZone(me.timezone)} · {workweekLabel(me.countryCode)}
                    </Txt>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
                        <Badge tone={tier === 'free' ? 'neutral' : 'primary'} icon="diamond-outline" label={TIER_LABEL[tier]} />
                        <Badge label={me.chronotype} icon="flash-outline" />
                        {mode === 'demo' ? <Badge tone="warning" label="Demo" /> : null}
                    </View>
                </View>
            </Card>

            {primary ? (
                <>
                    <SectionHeader title="Booking page" />
                    <ShareLinkCard username={me.username} slug={primary.slug} title={primary.title} />
                </>
            ) : null}

            <SectionHeader title="Scheduling" />
            <Card style={{ paddingVertical: 0 }}>
                <ListRow icon="time-outline" title="Availability" subtitle={`${schedules.length} schedule${schedules.length === 1 ? '' : 's'} · date overrides`} onPress={() => router.push('/availability')} />
                <ListRow icon="layers-outline" title="Event types" subtitle={`${eventTypes.filter((e) => e.ownerId === me.id).length} total`} onPress={() => router.push('/(tabs)/schedule')} />
                <ListRow icon="git-branch-outline" iconColor={c.accent} title="Routing forms" subtitle={can('routing_forms') ? 'Send invitees to the right event' : 'Team plan'} onPress={() => router.push('/routing')} />
                <ListRow icon="calendar-number-outline" iconColor={c.warning} title="Cultural calendar" subtitle="Holidays, observances and workweeks" onPress={() => router.push('/cultural-calendar')} last />
            </Card>

            <SectionHeader title="Workspace" />
            <Card style={{ paddingVertical: 0 }}>
                <ListRow icon="extension-puzzle-outline" title="Integrations" subtitle={`${calendars.length} calendar${calendars.length === 1 ? '' : 's'} · Slack · webhooks · embed`} onPress={() => router.push('/integrations')} />
                <ListRow icon="stats-chart-outline" iconColor={c.success} title="Analytics" subtitle="Meetings, fairness, after-hours load" onPress={() => router.push(can('analytics') ? '/analytics' : '/paywall')} />
                <ListRow icon="diamond-outline" iconColor={c.pink} title="Plans & billing" value={TIER_LABEL[tier]} onPress={() => router.push('/paywall')} />
                <ListRow icon="gift-outline" iconColor={c.warning} title="Refer & earn" subtitle="Give a month of Pro, get one" onPress={() => router.push('/referral')} last />
            </Card>

            <SectionHeader title="Account" />
            <Card style={{ paddingVertical: 0 }}>
                <ListRow icon="settings-outline" title="Settings" subtitle="Profile, theme, notifications, privacy" onPress={() => router.push('/settings')} />
                <ListRow icon="log-out-outline" iconColor={c.danger} title={mode === 'demo' ? 'Exit demo' : 'Sign out'} danger onPress={leave} last />
            </Card>
        </Screen>
    );
}
