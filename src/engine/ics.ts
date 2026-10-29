export interface IcsEvent {
    uid: string;
    title: string;
    start: number;
    end: number;
    description?: string;
    location?: string;
    url?: string;
    organizer?: { name: string; email: string };
    attendees?: { name: string; email: string }[];
    status?: 'CONFIRMED' | 'CANCELLED' | 'TENTATIVE';
    sequence?: number;
}

function stamp(ms: number): string {
    return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** RFC 5545 line folding: max 75 octets per line, continuation lines start with a space. */
function fold(line: string): string {
    const bytes = new TextEncoder().encode(line);
    if (bytes.length <= 75) return line;
    const out: string[] = [];
    let current = '';
    let size = 0;
    for (const ch of line) {
        const len = new TextEncoder().encode(ch).length;
        const limit = out.length === 0 ? 75 : 74;
        if (size + len > limit) {
            out.push(current);
            current = '';
            size = 0;
        }
        current += ch;
        size += len;
    }
    out.push(current);
    return out.join('\r\n ');
}

export function buildIcs(events: IcsEvent[], now: number = Date.now()): string {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TimeSync//Scheduling//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const e of events) {
        lines.push(
            'BEGIN:VEVENT',
            `UID:${e.uid}`,
            `DTSTAMP:${stamp(now)}`,
            `DTSTART:${stamp(e.start)}`,
            `DTEND:${stamp(e.end)}`,
            `SUMMARY:${escapeText(e.title)}`,
            `SEQUENCE:${e.sequence ?? 0}`,
            `STATUS:${e.status ?? 'CONFIRMED'}`,
        );
        if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
        if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
        if (e.url) lines.push(`URL:${e.url}`);
        if (e.organizer) lines.push(`ORGANIZER;CN=${escapeText(e.organizer.name)}:mailto:${e.organizer.email}`);
        for (const a of e.attendees ?? []) lines.push(`ATTENDEE;CN=${escapeText(a.name)};ROLE=REQ-PARTICIPANT:mailto:${a.email}`);
        lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
}
