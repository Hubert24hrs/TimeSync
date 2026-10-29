import { DateTime } from 'luxon';
import type { Weekday } from './types.ts';

// Regional workweeks. Countries not listed use Monday–Friday.
const SUN_THU: Weekday[] = [7, 1, 2, 3, 4];
const WORKWEEKS: Record<string, Weekday[]> = {
    IL: SUN_THU,
    SA: SUN_THU,
    EG: SUN_THU,
    KW: SUN_THU,
    QA: SUN_THU,
    BH: SUN_THU,
    OM: SUN_THU,
    JO: SUN_THU,
    IQ: SUN_THU,
    DZ: SUN_THU,
    NP: [7, 1, 2, 3, 4, 5],
};
const MON_FRI: Weekday[] = [1, 2, 3, 4, 5];

export function workweekFor(countryCode?: string): Weekday[] {
    return (countryCode && WORKWEEKS[countryCode.toUpperCase()]) || MON_FRI;
}

export function isWorkday(weekday: Weekday, countryCode?: string): boolean {
    return workweekFor(countryCode).includes(weekday);
}

export function workweekLabel(countryCode?: string): string {
    const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = workweekFor(countryCode);
    return `${names[days[0]]}–${names[days[days.length - 1]]}`;
}

export type HolidayKind = 'public' | 'religious' | 'cultural' | 'observance';

export interface Holiday {
    id: string;
    name: string;
    date: string; // yyyy-MM-dd
    /** ISO country codes where this is observed; '*' = worldwide observance. */
    countries: string[];
    kind: HolidayKind;
    /** Major = most people off work; minor = reduced availability likely. */
    level: 'major' | 'minor';
    emoji: string;
    description: string;
    /** Lunar / astronomical dates vary by region and sighting. */
    approximate?: boolean;
}

interface FixedHoliday {
    key: string;
    name: string;
    month: number;
    day: number;
    countries: string[];
    kind: HolidayKind;
    level: 'major' | 'minor';
    emoji: string;
    description: string;
}

const FIXED: FixedHoliday[] = [
    { key: 'new-year', name: "New Year's Day", month: 1, day: 1, countries: ['*'], kind: 'public', level: 'major', emoji: '🎆', description: 'Start of the Gregorian year.' },
    { key: 'in-republic', name: 'Republic Day', month: 1, day: 26, countries: ['IN'], kind: 'public', level: 'major', emoji: '🇮🇳', description: 'Adoption of the Constitution of India.' },
    { key: 'au-day', name: 'Australia Day', month: 1, day: 26, countries: ['AU'], kind: 'public', level: 'major', emoji: '🇦🇺', description: 'National day of Australia.' },
    { key: 'womens-day', name: "International Women's Day", month: 3, day: 8, countries: ['*'], kind: 'observance', level: 'minor', emoji: '♀️', description: 'Celebrates the achievements of women.' },
    { key: 'labour-day', name: 'Labour Day', month: 5, day: 1, countries: ['GB', 'IN', 'BR', 'NG', 'DE', 'FR', 'CN'], kind: 'public', level: 'major', emoji: '🛠️', description: "International Workers' Day." },
    { key: 'ng-democracy', name: 'Democracy Day', month: 6, day: 12, countries: ['NG'], kind: 'public', level: 'major', emoji: '🇳🇬', description: 'Return to democratic rule in Nigeria.' },
    { key: 'us-independence', name: 'Independence Day', month: 7, day: 4, countries: ['US'], kind: 'public', level: 'major', emoji: '🇺🇸', description: 'US national holiday.' },
    { key: 'in-independence', name: 'Independence Day', month: 8, day: 15, countries: ['IN'], kind: 'public', level: 'major', emoji: '🇮🇳', description: 'Independence of India.' },
    { key: 'br-independence', name: 'Independence Day', month: 9, day: 7, countries: ['BR'], kind: 'public', level: 'major', emoji: '🇧🇷', description: 'Independence of Brazil.' },
    { key: 'sa-national', name: 'Saudi National Day', month: 9, day: 23, countries: ['SA'], kind: 'public', level: 'major', emoji: '🇸🇦', description: 'Unification of the Kingdom.' },
    { key: 'ng-independence', name: 'Independence Day', month: 10, day: 1, countries: ['NG'], kind: 'public', level: 'major', emoji: '🇳🇬', description: 'Independence of Nigeria.' },
    { key: 'cn-national', name: 'National Day', month: 10, day: 1, countries: ['CN'], kind: 'public', level: 'major', emoji: '🇨🇳', description: 'Start of Golden Week in China.' },
    { key: 'day-of-dead', name: 'Day of the Dead', month: 11, day: 2, countries: ['MX'], kind: 'cultural', level: 'major', emoji: '💀', description: 'Honouring loved ones who have passed.' },
    { key: 'jp-culture', name: 'Culture Day', month: 11, day: 3, countries: ['JP'], kind: 'public', level: 'major', emoji: '🇯🇵', description: 'Promotes culture and freedom.' },
    { key: 'ae-national', name: 'UAE National Day', month: 12, day: 2, countries: ['AE'], kind: 'public', level: 'major', emoji: '🇦🇪', description: 'Founding of the UAE.' },
    { key: 'christmas', name: 'Christmas Day', month: 12, day: 25, countries: ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'NG', 'GH', 'KE', 'ZA', 'BR', 'MX', 'DE', 'FR', 'ES', 'IT', 'IN', 'PH'], kind: 'religious', level: 'major', emoji: '🎄', description: 'Celebration of the birth of Jesus.' },
    { key: 'boxing-day', name: 'Boxing Day', month: 12, day: 26, countries: ['GB', 'AU', 'NG', 'CA'], kind: 'public', level: 'major', emoji: '🎁', description: 'Public holiday after Christmas.' },
    { key: 'kwanzaa', name: 'Kwanzaa begins', month: 12, day: 26, countries: ['US'], kind: 'cultural', level: 'minor', emoji: '🕯️', description: 'Week-long celebration of African heritage.' },
];

type Movable = Omit<Holiday, 'id'> & { key: string };

// Movable feasts for the years the app ships demo data for. Lunar dates are best estimates.
const MOVABLE: Movable[] = [
    // 2026
    { key: 'lunar-ny', name: 'Lunar New Year', date: '2026-02-17', countries: ['CN', 'VN', 'KR', 'SG'], kind: 'cultural', level: 'major', emoji: '🧧', description: 'New year on the lunisolar calendar.', approximate: true },
    { key: 'ramadan', name: 'Ramadan begins', date: '2026-02-18', countries: ['*'], kind: 'religious', level: 'minor', emoji: '🌙', description: 'Month of fasting from dawn to sunset; expect shorter working days in many regions.', approximate: true },
    { key: 'holi', name: 'Holi', date: '2026-03-04', countries: ['IN', 'NP'], kind: 'religious', level: 'major', emoji: '🎨', description: 'Festival of colours marking spring.', approximate: true },
    { key: 'eid-fitr', name: 'Eid al-Fitr', date: '2026-03-20', countries: ['SA', 'AE', 'EG', 'NG', 'IN', 'ID', 'PK', 'QA', 'KW', 'JO', 'BH', 'OM', 'IQ', 'DZ'], kind: 'religious', level: 'major', emoji: '🕌', description: 'Festival marking the end of Ramadan.', approximate: true },
    { key: 'nowruz', name: 'Nowruz', date: '2026-03-21', countries: ['IR', 'AF'], kind: 'cultural', level: 'major', emoji: '🌷', description: 'Persian New Year at the spring equinox.', approximate: true },
    { key: 'good-friday', name: 'Good Friday', date: '2026-04-03', countries: ['GB', 'AU', 'NG', 'BR', 'CA', 'DE'], kind: 'religious', level: 'major', emoji: '✝️', description: 'Christian observance before Easter.' },
    { key: 'easter-monday', name: 'Easter Monday', date: '2026-04-06', countries: ['GB', 'AU', 'NG', 'DE', 'FR', 'CA'], kind: 'religious', level: 'major', emoji: '🐣', description: 'Public holiday after Easter Sunday.' },
    { key: 'golden-week', name: 'Golden Week', date: '2026-04-29', countries: ['JP'], kind: 'public', level: 'major', emoji: '🏯', description: 'Cluster of national holidays (29 Apr – 5 May).' },
    { key: 'eid-adha', name: 'Eid al-Adha', date: '2026-05-27', countries: ['SA', 'AE', 'EG', 'NG', 'IN', 'ID', 'PK', 'QA', 'KW', 'JO', 'BH', 'OM', 'IQ', 'DZ'], kind: 'religious', level: 'major', emoji: '🐑', description: 'Festival of Sacrifice.', approximate: true },
    { key: 'us-memorial', name: 'Memorial Day', date: '2026-05-25', countries: ['US'], kind: 'public', level: 'major', emoji: '🇺🇸', description: 'Last Monday of May.' },
    { key: 'us-labor', name: 'Labor Day', date: '2026-09-07', countries: ['US', 'CA'], kind: 'public', level: 'major', emoji: '🛠️', description: 'First Monday of September.' },
    { key: 'rosh-hashanah', name: 'Rosh Hashanah', date: '2026-09-12', countries: ['IL'], kind: 'religious', level: 'major', emoji: '🍎', description: 'Jewish New Year.', approximate: true },
    { key: 'yom-kippur', name: 'Yom Kippur', date: '2026-09-21', countries: ['IL'], kind: 'religious', level: 'major', emoji: '✡️', description: 'Day of Atonement.', approximate: true },
    { key: 'mid-autumn', name: 'Mid-Autumn Festival', date: '2026-09-25', countries: ['CN', 'VN', 'TW', 'HK'], kind: 'cultural', level: 'major', emoji: '🥮', description: 'Harvest moon festival.', approximate: true },
    { key: 'diwali', name: 'Diwali', date: '2026-11-08', countries: ['IN', 'NP', 'SG', 'MY'], kind: 'religious', level: 'major', emoji: '🪔', description: 'Festival of lights.', approximate: true },
    { key: 'us-thanksgiving', name: 'Thanksgiving', date: '2026-11-26', countries: ['US'], kind: 'public', level: 'major', emoji: '🦃', description: 'Fourth Thursday of November.' },
    // 2027
    { key: 'lunar-ny', name: 'Lunar New Year', date: '2027-02-06', countries: ['CN', 'VN', 'KR', 'SG'], kind: 'cultural', level: 'major', emoji: '🧧', description: 'New year on the lunisolar calendar.', approximate: true },
    { key: 'ramadan', name: 'Ramadan begins', date: '2027-02-08', countries: ['*'], kind: 'religious', level: 'minor', emoji: '🌙', description: 'Month of fasting from dawn to sunset; expect shorter working days in many regions.', approximate: true },
    { key: 'eid-fitr', name: 'Eid al-Fitr', date: '2027-03-10', countries: ['SA', 'AE', 'EG', 'NG', 'IN', 'ID', 'PK', 'QA', 'KW', 'JO', 'BH', 'OM', 'IQ', 'DZ'], kind: 'religious', level: 'major', emoji: '🕌', description: 'Festival marking the end of Ramadan.', approximate: true },
    { key: 'holi', name: 'Holi', date: '2027-03-22', countries: ['IN', 'NP'], kind: 'religious', level: 'major', emoji: '🎨', description: 'Festival of colours marking spring.', approximate: true },
    { key: 'good-friday', name: 'Good Friday', date: '2027-03-26', countries: ['GB', 'AU', 'NG', 'BR', 'CA', 'DE'], kind: 'religious', level: 'major', emoji: '✝️', description: 'Christian observance before Easter.' },
    { key: 'easter-monday', name: 'Easter Monday', date: '2027-03-29', countries: ['GB', 'AU', 'NG', 'DE', 'FR', 'CA'], kind: 'religious', level: 'major', emoji: '🐣', description: 'Public holiday after Easter Sunday.' },
];

function fixedFor(year: number): Holiday[] {
    return FIXED.map((h) => ({
        id: `${h.key}-${year}`,
        name: h.name,
        date: DateTime.fromObject({ year, month: h.month, day: h.day }).toISODate() ?? '',
        countries: h.countries,
        kind: h.kind,
        level: h.level,
        emoji: h.emoji,
        description: h.description,
    }));
}

/** Holidays between two dates (inclusive, yyyy-MM-dd), optionally limited to some countries. */
export function holidaysBetween(from: string, to: string, countries?: string[]): Holiday[] {
    const startYear = Number(from.slice(0, 4));
    const endYear = Number(to.slice(0, 4));
    const all: Holiday[] = [];
    for (let y = startYear; y <= endYear; y++) all.push(...fixedFor(y));
    all.push(...MOVABLE.map(({ key, ...rest }) => ({ ...rest, id: `${key}-${rest.date.slice(0, 4)}` })));
    const wanted = countries?.map((c) => c.toUpperCase());
    return all
        .filter((h) => h.date >= from && h.date <= to)
        .filter((h) => !wanted || h.countries.includes('*') || h.countries.some((c) => wanted.includes(c)))
        .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/** Major public/religious holiday for a country on a date, if any (worldwide minor observances ignored). */
export function holidayOn(date: string, countryCode?: string): Holiday | undefined {
    if (!countryCode) return undefined;
    const cc = countryCode.toUpperCase();
    return holidaysBetween(date, date).find((h) => h.level === 'major' && (h.countries.includes(cc) || (h.countries.includes('*') && h.kind !== 'observance')));
}
