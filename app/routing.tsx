import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { FeatureGate } from '../src/components/Monetization';
import { route } from '../src/engine';
import { useMe, useWorkspace } from '../src/hooks/useWorkspace';
import { spacing, useTheme } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { Badge, Button, Card, Chip, EmptyState, SectionHeader, Txt } from '../src/ui/primitives';

const OPS = { equals: 'is', not_equals: 'is not', contains: 'contains', in: 'is one of', gte: '≥', lte: '≤' } as const;

/** Routing forms: qualify invitees, then send them to the right event type or host. */
export default function Routing() {
    const { c } = useTheme();
    const me = useMe();
    const { routingForms, eventTypes } = useWorkspace();
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const title = (id: string) => eventTypes.find((e) => e.id === id)?.title ?? 'Unknown event';

    return (
        <Screen title="Routing forms" subtitle="Ask a few questions, route to the right meeting" back maxWidth={820}>
            <FeatureGate feature="routing_forms">
                {routingForms.length === 0 ? <EmptyState icon="git-branch-outline" title="No routing forms" body="Create one in the web dashboard or via the API." /> : null}
                {routingForms.map((f) => {
                    const a = answers[f.id] ?? {};
                    const target = route(f.form, a);
                    return (
                        <Card key={f.id} style={{ gap: spacing.md, marginBottom: spacing.lg }}>
                            <Txt variant="h3">{f.title}</Txt>
                            <SectionHeader title="Rules" style={{ marginTop: 0, marginBottom: 0 }} />
                            {f.form.rules.map((r, i) => (
                                <Txt key={r.id} variant="caption" tone="secondary">
                                    {i + 1}. If {r.when.map((w) => `${f.questions.find((q) => q.id === w.questionId)?.label ?? w.questionId} ${OPS[w.op]} ${Array.isArray(w.value) ? w.value.join('/') : w.value}`).join(' and ')} → {r.then.type === 'event_type' ? title(r.then.eventTypeId) : r.then.type === 'url' ? r.then.url : 'message'}
                                </Txt>
                            ))}
                            <Txt variant="caption" tone="muted">
                                Otherwise → {f.form.fallback.type === 'event_type' ? title(f.form.fallback.eventTypeId) : 'fallback'}
                            </Txt>

                            <SectionHeader title="Try it" style={{ marginTop: spacing.sm, marginBottom: 0 }} />
                            {f.questions.map((q) => (
                                <View key={q.id} style={{ gap: spacing.sm }}>
                                    <Txt variant="label" tone="secondary">
                                        {q.label}
                                    </Txt>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                                        {q.options.map((o) => (
                                            <Chip key={o} label={o} selected={a[q.id] === o} onPress={() => setAnswers({ ...answers, [f.id]: { ...a, [q.id]: o } })} />
                                        ))}
                                    </View>
                                </View>
                            ))}
                            <Card accent={c.accent} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                                <Badge tone="accent" label="Routes to" />
                                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                                    {target.type === 'event_type' ? title(target.eventTypeId) : target.type === 'url' ? target.url : target.message}
                                </Txt>
                                {target.type === 'event_type' && me ? (
                                    <Button
                                        title="Open"
                                        size="sm"
                                        onPress={() => {
                                            const et = eventTypes.find((e) => e.id === target.eventTypeId);
                                            if (et) router.push(`/${me.username}/${et.slug}`);
                                        }}
                                    />
                                ) : null}
                            </Card>
                        </Card>
                    );
                })}
            </FeatureGate>
        </Screen>
    );
}
