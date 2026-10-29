export const fontFamilies = {
    primary: 'Inter_400Regular',
    primaryMedium: 'Inter_500Medium',
    primarySemiBold: 'Inter_600SemiBold',
    primaryBold: 'Inter_700Bold',
    display: 'SpaceGrotesk_500Medium',
    displayBold: 'SpaceGrotesk_700Bold',
    mono: 'JetBrainsMono_400Regular',
    monoBold: 'JetBrainsMono_700Bold',
} as const;

export const type = {
    display: { fontFamily: fontFamilies.displayBold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
    h1: { fontFamily: fontFamilies.displayBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
    h2: { fontFamily: fontFamilies.displayBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
    h3: { fontFamily: fontFamilies.display, fontSize: 18, lineHeight: 24 },
    body: { fontFamily: fontFamilies.primary, fontSize: 15, lineHeight: 22 },
    bodyStrong: { fontFamily: fontFamilies.primarySemiBold, fontSize: 15, lineHeight: 22 },
    label: { fontFamily: fontFamilies.primarySemiBold, fontSize: 13, lineHeight: 18 },
    caption: { fontFamily: fontFamilies.primary, fontSize: 12, lineHeight: 16 },
    overline: { fontFamily: fontFamilies.primarySemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' as const },
    clock: { fontFamily: fontFamilies.monoBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
    mono: { fontFamily: fontFamilies.mono, fontSize: 13, lineHeight: 18 },
} as const;
