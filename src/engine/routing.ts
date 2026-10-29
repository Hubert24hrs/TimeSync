export type RoutingOperator = 'equals' | 'not_equals' | 'contains' | 'in' | 'gte' | 'lte';

export interface RoutingCondition {
    questionId: string;
    op: RoutingOperator;
    value: string | string[] | number;
}

export type RoutingTarget =
    | { type: 'event_type'; eventTypeId: string; hostIds?: string[] }
    | { type: 'url'; url: string }
    | { type: 'message'; message: string };

export interface RoutingRule {
    id: string;
    /** All conditions must match. */
    when: RoutingCondition[];
    then: RoutingTarget;
}

export interface RoutingForm {
    id: string;
    rules: RoutingRule[];
    fallback: RoutingTarget;
}

function matches(c: RoutingCondition, answers: Record<string, string>): boolean {
    const raw = answers[c.questionId];
    if (raw === undefined) return false;
    const answer = raw.trim().toLowerCase();
    switch (c.op) {
        case 'equals':
            return answer === String(c.value).toLowerCase();
        case 'not_equals':
            return answer !== String(c.value).toLowerCase();
        case 'contains':
            return answer.includes(String(c.value).toLowerCase());
        case 'in':
            return (Array.isArray(c.value) ? c.value : [String(c.value)]).map((v) => v.toLowerCase()).includes(answer);
        case 'gte':
            return Number(raw) >= Number(c.value);
        case 'lte':
            return Number(raw) <= Number(c.value);
    }
}

/** First matching rule wins; otherwise the fallback. */
export function route(form: RoutingForm, answers: Record<string, string>): RoutingTarget {
    return form.rules.find((r) => r.when.every((c) => matches(c, answers)))?.then ?? form.fallback;
}
