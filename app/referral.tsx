import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { useMe } from '../src/hooks/useWorkspace';
import { BOOKING_ORIGIN } from '../src/lib/config';
import { haptics } from '../src/lib/haptics';
import { claimReward, setReferralCode } from '../src/store/slices/referralSlice';
import { useAppDispatch, useAppSelector } from '../src/store/store';
import { spacing, useTheme } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Button, Card, Stat, Txt } from '../src/ui/primitives';

const STEPS = ['Share your invite link', 'A friend signs up and books their first meeting', 'You both get a month of Pro'];

export default function Referral() {
    const { c } = useTheme();
    const dispatch = useAppDispatch();
    const me = useMe();
    const r = useAppSelector((s) => s.referral);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!r.code && me) dispatch(setReferralCode(`${me.username.toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`));
    }, [r.code, me, dispatch]);
    const link = `${BOOKING_ORIGIN}/?ref=${r.code ?? ''}`;

    return (
        <Screen title="Refer & earn" subtitle="Give a month of Pro, get a month of Pro" back maxWidth={720}>
            <Card accent={c.pink} style={{ gap: spacing.md }}>
                <Txt variant="overline" tone="muted">
                    Your code
                </Txt>
                <Txt variant="clock" selectable>
                    {r.code ?? '…'}
                </Txt>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Button
                        title={copied ? 'Copied!' : 'Copy link'}
                        icon="copy-outline"
                        size="sm"
                        onPress={async () => {
                            await Clipboard.setStringAsync(link);
                            haptics.success();
                            setCopied(true);
                        }}
                    />
                    {Platform.OS !== 'web' ? <Button title="Share" size="sm" variant="secondary" icon="share-outline" onPress={() => Share.share({ message: `Schedule across time zones without the 2am calls — join me on TimeSync: ${link}` })} /> : null}
                </View>
            </Card>
            <Card style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg }}>
                <Stat label="Invited" value={String(r.totalReferrals)} icon="people-outline" />
                <Stat label="Pending" value={String(r.pendingRewards)} icon="hourglass-outline" tone={c.warning} />
                <Stat label="Claimed" value={String(r.claimedRewards)} icon="gift-outline" tone={c.success} />
            </Card>
            {r.pendingRewards > 0 ? <Button title="Claim reward" icon="gift" onPress={() => dispatch(claimReward())} style={{ marginTop: spacing.md }} /> : null}
            <Card style={{ gap: spacing.md, marginTop: spacing.lg }}>
                {STEPS.map((s, i) => (
                    <View key={s} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                        <Txt variant="clock" tone="primary" style={{ fontSize: 20, width: 24 }}>
                            {i + 1}
                        </Txt>
                        <Txt tone="secondary" style={{ flex: 1 }}>
                            {s}
                        </Txt>
                    </View>
                ))}
            </Card>
            <Txt variant="caption" tone="muted" style={{ marginTop: spacing.md }}>
                Referral tracking is local in this build; server-side attribution is not wired yet.
            </Txt>
        </Screen>
    );
}
