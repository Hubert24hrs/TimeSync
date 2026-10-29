import { assistantFacts, assistantReply, type AssistantContext } from '../assistant';

const now = Date.parse('2026-11-02T12:00:00Z'); // Monday
const ctx: AssistantContext = {
    now,
    user: { id: 'me', name: 'Alex', timezone: 'America/New_York', chronotype: 'wolf', countryCode: 'US' },
    team: [
        { id: 'ldn', name: 'James', timezone: 'Europe/London', chronotype: 'bear', countryCode: 'GB' },
        { id: 'lag', name: 'Kwame', timezone: 'Africa/Lagos', chronotype: 'lion', countryCode: 'NG' },
    ],
    meetings: [
        { title: 'Standup', start: Date.parse('2026-11-03T14:00:00Z'), end: Date.parse('2026-11-03T14:30:00Z') },
        { title: 'Design review', start: Date.parse('2026-11-03T14:15:00Z'), end: Date.parse('2026-11-03T15:00:00Z') },
    ],
};

describe('assistantReply', () => {
    it('suggests fair team slots', () => {
        const r = assistantReply('What is the best time for a meeting?', ctx);
        expect(r.suggestions.length).toBeGreaterThan(0);
        expect(r.text).toMatch(/fairness/);
    });

    it('finds conflicts', () => {
        expect(assistantReply('any conflicts?', ctx).text).toMatch(/"Standup" overlaps "Design review"/);
    });

    it('explains energy peaks per chronotype', () => {
        expect(assistantReply('when is my energy peak', ctx).text).toMatch(/wolf/);
    });

    it('falls back to help text', () => {
        expect(assistantReply('hello', ctx).quickReplies.length).toBeGreaterThan(0);
    });

    it('builds grounded facts', () => {
        const f = assistantFacts(ctx);
        expect(f.conflicts).toHaveLength(1);
        expect(f.suggestedSlots.length).toBeGreaterThan(0);
        expect(f.team).toHaveLength(2);
    });
});
