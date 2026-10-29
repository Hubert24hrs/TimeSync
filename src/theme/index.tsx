import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { setTheme } from '../store/slices/settingsSlice';
import { darkColors, lightColors, type ThemeColors } from './tokens';

export * from './tokens';
export * from './typography';
export * from './spacing';

export type ThemeMode = 'dark' | 'light' | 'auto';

interface ThemeContextValue {
    mode: ThemeMode;
    isDark: boolean;
    c: ThemeColors;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const system = useColorScheme();
    const mode = useSelector((s: RootState) => s.settings.theme);
    const dispatch = useDispatch<AppDispatch>();
    const isDark = mode === 'auto' ? system !== 'light' : mode === 'dark';
    const value = useMemo<ThemeContextValue>(
        () => ({ mode, isDark, c: isDark ? darkColors : lightColors, setMode: (m) => dispatch(setTheme(m)) }),
        [mode, isDark, dispatch],
    );
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
