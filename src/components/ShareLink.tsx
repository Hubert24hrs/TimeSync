import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { BOOKING_ORIGIN, bookingUrl } from '../lib/config';
import { haptics } from '../lib/haptics';
import { radius, spacing, useTheme } from '../theme';
import { Button, Card, Segmented, Txt } from '../ui/primitives';

export function embedSnippet(url: string): string {
    return `<iframe src="${url}?embed=1" style="width:100%;min-height:720px;border:0;border-radius:16px" loading="lazy" title="Book a meeting"></iframe>`;
}

export function popupSnippet(url: string): string {
    return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#7C5CFF;color:#fff;font:600 15px system-ui;text-decoration:none">Book a time with me</a>`;
}

/** Booking link with copy / share, QR code and embeddable widget code. */
export function ShareLinkCard({ username, slug, title }: { username: string; slug: string; title: string }) {
    const { c } = useTheme();
    const url = bookingUrl(username, slug);
    const [tab, setTab] = useState<'link' | 'qr' | 'embed'>('link');
    const [copied, setCopied] = useState<string | null>(null);
    const copy = async (value: string, what: string) => {
        await Clipboard.setStringAsync(value);
        haptics.success();
        setCopied(what);
        setTimeout(() => setCopied(null), 1500);
    };
    return (
        <Card style={{ gap: spacing.md }}>
            <Segmented
                value={tab}
                onChange={setTab}
                options={[
                    { value: 'link', label: 'Link' },
                    { value: 'qr', label: 'QR code' },
                    { value: 'embed', label: 'Embed' },
                ]}
            />
            {tab === 'link' ? (
                <>
                    <Txt variant="mono" tone="secondary" selectable numberOfLines={2}>
                        {url}
                    </Txt>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                        <Button title={copied === 'link' ? 'Copied!' : 'Copy link'} icon="copy-outline" size="sm" onPress={() => copy(url, 'link')} />
                        {Platform.OS !== 'web' ? <Button title="Share" icon="share-outline" size="sm" variant="secondary" onPress={() => Share.share({ message: `Book "${title}" with me: ${url}` })} /> : null}
                    </View>
                </>
            ) : tab === 'qr' ? (
                <View style={{ alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: radius.lg }} accessibilityLabel={`QR code for ${url}`}>
                        <QRCode value={url} size={168} color="#0F0F1E" backgroundColor="#FFFFFF" />
                    </View>
                    <Txt variant="caption" tone="muted">
                        Scan to book “{title}”
                    </Txt>
                </View>
            ) : (
                <View style={{ gap: spacing.sm }}>
                    <Txt variant="caption" tone="muted">
                        Paste into any website. Works on {BOOKING_ORIGIN.replace('https://', '')} links.
                    </Txt>
                    <View style={{ backgroundColor: c.bgAlt, borderRadius: radius.md, padding: spacing.md }}>
                        <Txt variant="mono" tone="secondary" selectable numberOfLines={4}>
                            {embedSnippet(url)}
                        </Txt>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                        <Button title={copied === 'inline' ? 'Copied!' : 'Copy inline embed'} size="sm" icon="code-slash" onPress={() => copy(embedSnippet(url), 'inline')} />
                        <Button title={copied === 'button' ? 'Copied!' : 'Copy button'} size="sm" variant="secondary" onPress={() => copy(popupSnippet(url), 'button')} />
                    </View>
                </View>
            )}
        </Card>
    );
}
