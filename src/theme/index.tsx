import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { typography, fontFamilies, fontSizes, lineHeights } from './typography';
import { spacing, borderRadius, iconSizes, hitSlop } from './spacing';
import { shadows } from './shadows';
import { springConfigs, timingConfigs, animationDelays } from './animations';

export { colors, typography, fontFamilies, fontSizes, lineHeights, spacing, borderRadius, iconSizes, hitSlop, shadows, springConfigs, timingConfigs, animationDelays };

export type ThemeMode = 'dark' | 'light' | 'auto';

interface ThemeColors {
    bg: string;
    card: string;
    elevated: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryLight: string;
}

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    themeColors: ThemeColors;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkThemeColors: ThemeColors = {
    bg: colors.dark.bg,
    card: colors.dark.card,
    elevated: colors.dark.elevated,
    surface: colors.dark.surface,
    border: colors.dark.border,
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.75)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    primary: colors.primary.main,
    primaryLight: colors.primary.light,
};

const lightThemeColors: ThemeColors = {
    bg: colors.light.bg,
    card: colors.light.card,
    elevated: colors.light.elevated,
    surface: colors.light.surface,
    border: colors.light.border,
    text: '#1A1A2E',
    textSecondary: 'rgba(26, 26, 46, 0.75)',
    textMuted: 'rgba(26, 26, 46, 0.5)',
    primary: colors.primary.main,
    primaryLight: colors.primary.light,
};

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('dark');

    const isDark = useMemo(() => {
        if (mode === 'auto') return systemScheme === 'dark';
        return mode === 'dark';
    }, [mode, systemScheme]);

    const themeColors = useMemo(() => (isDark ? darkThemeColors : lightThemeColors), [isDark]);

    const value = useMemo(() => ({ mode, isDark, themeColors, setMode }), [mode, isDark, themeColors]);

    return <ThemeContext.Provider value={ value }> { children } </ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
