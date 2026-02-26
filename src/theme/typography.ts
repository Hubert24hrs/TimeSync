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

export const fontSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 36,
    hero: 48,
} as const;

export const lineHeights = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 38,
    display: 44,
    hero: 58,
} as const;

export const typography = {
    h1: {
        fontFamily: fontFamilies.displayBold,
        fontSize: fontSizes.hero,
        lineHeight: lineHeights.hero,
    },
    h2: {
        fontFamily: fontFamilies.displayBold,
        fontSize: fontSizes.display,
        lineHeight: lineHeights.display,
    },
    h3: {
        fontFamily: fontFamilies.display,
        fontSize: fontSizes.xxxl,
        lineHeight: lineHeights.xxxl,
    },
    h4: {
        fontFamily: fontFamilies.primaryBold,
        fontSize: fontSizes.xxl,
        lineHeight: lineHeights.xxl,
    },
    body: {
        fontFamily: fontFamilies.primary,
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
    },
    bodyMedium: {
        fontFamily: fontFamilies.primaryMedium,
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
    },
    caption: {
        fontFamily: fontFamilies.primary,
        fontSize: fontSizes.sm,
        lineHeight: lineHeights.sm,
    },
    label: {
        fontFamily: fontFamilies.primarySemiBold,
        fontSize: fontSizes.md,
        lineHeight: lineHeights.md,
    },
    time: {
        fontFamily: fontFamilies.mono,
        fontSize: fontSizes.xxl,
        lineHeight: lineHeights.xxl,
    },
    timeLarge: {
        fontFamily: fontFamilies.monoBold,
        fontSize: fontSizes.display,
        lineHeight: lineHeights.display,
    },
    button: {
        fontFamily: fontFamilies.primarySemiBold,
        fontSize: fontSizes.lg,
        lineHeight: lineHeights.lg,
    },
} as const;
