import { useWindowDimensions } from 'react-native';
import { MAX_CONTENT_WIDTH, WIDE_BREAKPOINT } from '../theme';

/** Responsive helpers: phones get one column, tablets/web get a side rail and bento columns. */
export function useLayout() {
    const { width, height } = useWindowDimensions();
    const isWide = width >= WIDE_BREAKPOINT;
    const contentWidth = Math.min(width - (isWide ? 240 : 0), MAX_CONTENT_WIDTH);
    return { width, height, isWide, isTablet: width >= 700, columns: contentWidth >= 1000 ? 3 : contentWidth >= 640 ? 2 : 1, contentWidth };
}
