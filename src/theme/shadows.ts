import { Platform, ViewStyle } from 'react-native';

const createShadow = (
    color: string,
    offset: { width: number; height: number },
    opacity: number,
    radius: number,
    elevation: number
): ViewStyle => ({
    ...Platform.select({
        ios: {
            shadowColor: color,
            shadowOffset: offset,
            shadowOpacity: opacity,
            shadowRadius: radius,
        },
        android: {
            elevation,
        },
    }),
});

export const shadows = {
    glass: createShadow('#000000', { width: 0, height: 4 }, 0.15, 12, 4),
    elevated: createShadow('#000000', { width: 0, height: 8 }, 0.25, 24, 8),
    floating: createShadow('#000000', { width: 0, height: 16 }, 0.3, 32, 12),
    neonPrimary: createShadow('#6C5CE7', { width: 0, height: 4 }, 0.4, 16, 6),
    neonSecondary: createShadow('#00D2D3', { width: 0, height: 4 }, 0.4, 16, 6),
    neonPink: createShadow('#FD79A8', { width: 0, height: 4 }, 0.4, 16, 6),
    subtle: createShadow('#000000', { width: 0, height: 2 }, 0.1, 8, 2),
    card: createShadow('#000000', { width: 0, height: 6 }, 0.2, 16, 6),
} as const;
