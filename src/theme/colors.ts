export const colors = {
    primary: {
        main: '#6C5CE7',
        light: '#A29BFE',
        dark: '#5F27CD',
    },
    secondary: {
        main: '#00D2D3',
        light: '#0ABDE3',
        dark: '#01A3A4',
    },
    accent: {
        pink: '#FD79A8',
        yellow: '#FDCB6E',
        coral: '#FF7675',
    },
    dark: {
        bg: '#0F0F1E',
        card: '#1A1A2E',
        elevated: '#25253E',
        surface: '#2D2D44',
        border: '#3E3E5C',
    },
    light: {
        bg: '#F8F9FA',
        card: '#FFFFFF',
        elevated: '#F0F2F5',
        surface: '#E8EAF0',
        border: '#D1D5DB',
    },
    glass: {
        white: 'rgba(255, 255, 255, 0.08)',
        whiteMedium: 'rgba(255, 255, 255, 0.15)',
        border: 'rgba(255, 255, 255, 0.12)',
        borderLight: 'rgba(255, 255, 255, 0.2)',
        text: 'rgba(255, 255, 255, 0.9)',
        textMuted: 'rgba(255, 255, 255, 0.6)',
        overlay: 'rgba(0, 0, 0, 0.3)',
    },
    gradients: {
        primary: ['#6C5CE7', '#A29BFE'] as const,
        secondary: ['#00D2D3', '#0ABDE3'] as const,
        accent: ['#FD79A8', '#FDCB6E'] as const,
        cosmic: ['#667eea', '#764ba2'] as const,
        ocean: ['#4facfe', '#00f2fe'] as const,
        sunset: ['#fa709a', '#fee140'] as const,
        aurora: ['#43e97b', '#38f9d7'] as const,
        dark: ['#0F0F1E', '#1A1A2E'] as const,
        darkCard: ['#1A1A2E', '#25253E'] as const,
    },
    status: {
        success: '#00B894',
        warning: '#FDCB6E',
        error: '#FF7675',
        info: '#74B9FF',
    },
    energy: {
        peak: '#6C5CE7',
        high: '#00B894',
        medium: '#FDCB6E',
        low: '#FF7675',
    },
    chronotype: {
        lion: '#FDCB6E',
        bear: '#00B894',
        wolf: '#6C5CE7',
        dolphin: '#0ABDE3',
    },
} as const;

export type ColorTheme = typeof colors;
