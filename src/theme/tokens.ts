// Design tokens. Dark is the primary experience; light mirrors it with the same accents.

export const palette = {
    navy: '#0F0F1E',
    violet: '#7C5CFF',
    violetDeep: '#5B3DF5',
    cyan: '#22D3EE',
    pink: '#FF5CAA',
    amber: '#FFC857',
    mint: '#2EE6A6',
    coral: '#FF6B81',
    sky: '#5EA8FF',
} as const;

export interface ThemeColors {
    bg: string;
    bgAlt: string;
    card: string;
    cardSolid: string;
    cardPressed: string;
    border: string;
    borderStrong: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textOnAccent: string;
    primary: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
    pink: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    info: string;
    skeleton: string;
    overlay: string;
    tabBar: string;
}

export const darkColors: ThemeColors = {
    bg: palette.navy,
    bgAlt: '#15152A',
    card: 'rgba(255,255,255,0.055)',
    cardSolid: '#1A1A31',
    cardPressed: 'rgba(255,255,255,0.09)',
    border: 'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.18)',
    text: '#F4F4FF',
    textSecondary: 'rgba(244,244,255,0.74)',
    textMuted: 'rgba(244,244,255,0.56)',
    textOnAccent: '#FFFFFF',
    primary: palette.violet,
    primarySoft: 'rgba(124,92,255,0.18)',
    accent: palette.cyan,
    accentSoft: 'rgba(34,211,238,0.14)',
    pink: palette.pink,
    success: palette.mint,
    successSoft: 'rgba(46,230,166,0.14)',
    warning: palette.amber,
    warningSoft: 'rgba(255,200,87,0.16)',
    danger: palette.coral,
    dangerSoft: 'rgba(255,107,129,0.16)',
    info: palette.sky,
    skeleton: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(5,5,15,0.6)',
    tabBar: 'rgba(15,15,30,0.82)',
};

export const lightColors: ThemeColors = {
    bg: '#F5F5FB',
    bgAlt: '#ECECF7',
    card: '#FFFFFF',
    cardSolid: '#FFFFFF',
    cardPressed: '#F0F0F8',
    border: 'rgba(15,15,30,0.08)',
    borderStrong: 'rgba(15,15,30,0.16)',
    text: '#0F0F1E',
    textSecondary: 'rgba(15,15,30,0.74)',
    textMuted: 'rgba(15,15,30,0.58)',
    textOnAccent: '#FFFFFF',
    primary: palette.violetDeep,
    primarySoft: 'rgba(91,61,245,0.10)',
    accent: '#0891B2',
    accentSoft: 'rgba(8,145,178,0.10)',
    pink: '#D6337F',
    success: '#0E9F6E',
    successSoft: 'rgba(14,159,110,0.10)',
    warning: '#B7791F',
    warningSoft: 'rgba(183,121,31,0.12)',
    danger: '#D63A55',
    dangerSoft: 'rgba(214,58,85,0.10)',
    info: '#2F6FD6',
    skeleton: 'rgba(15,15,30,0.07)',
    overlay: 'rgba(15,15,30,0.4)',
    tabBar: 'rgba(255,255,255,0.88)',
};

export const gradients = {
    primary: [palette.violet, palette.cyan] as const,
    aurora: [palette.violet, palette.pink] as const,
    sunrise: [palette.amber, palette.pink] as const,
    mint: [palette.mint, palette.cyan] as const,
    darkBg: ['#0F0F1E', '#171433', '#0F0F1E'] as const,
    lightBg: ['#F5F5FB', '#EFEAFF', '#F5F5FB'] as const,
};

export const chronotypeColors = { lion: palette.amber, bear: palette.mint, wolf: palette.violet, dolphin: palette.cyan } as const;

export function energyColor(level: number, c: ThemeColors): string {
    if (level >= 8) return c.primary;
    if (level >= 6) return c.success;
    if (level >= 4) return c.warning;
    return c.danger;
}

export function scoreColor(score: number, c: ThemeColors): string {
    if (score >= 85) return c.success;
    if (score >= 65) return c.warning;
    return c.danger;
}
