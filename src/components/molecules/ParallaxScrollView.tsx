import React, { useRef } from 'react';
import { StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

const { height: SCREEN_H } = Dimensions.get('window');

interface ParallaxScrollViewProps {
    children: React.ReactNode;
    headerContent?: React.ReactNode;
    backgroundContent?: React.ReactNode;
    headerHeight?: number;
    style?: StyleProp<ViewStyle>;
}

export function ParallaxScrollView({
    children,
    headerContent,
    backgroundContent,
    headerHeight = 250,
    style,
}: ParallaxScrollViewProps) {
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Header parallax (moves at 0.5x scroll speed)
    const headerStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, headerHeight],
            [0, headerHeight * 0.5],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            scrollY.value,
            [0, headerHeight * 0.8],
            [1, 0],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            scrollY.value,
            [-100, 0],
            [1.3, 1],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }, { scale }],
            opacity,
        };
    });

    // Background layer (moves at 0.3x speed for depth)
    const backgroundStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, SCREEN_H],
            [0, SCREEN_H * 0.3],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }],
        };
    });

    return (
        <Animated.View style={[styles.container, style]}>
            {/* Parallax background */}
            {backgroundContent && (
                <Animated.View style={[styles.backgroundLayer, backgroundStyle]}>
                    {backgroundContent}
                </Animated.View>
            )}

            {/* Parallax header */}
            {headerContent && (
                <Animated.View style={[styles.headerLayer, { height: headerHeight }, headerStyle]}>
                    {headerContent}
                </Animated.View>
            )}

            {/* Scrollable content */}
            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    headerContent ? { paddingTop: headerHeight } : undefined,
                ]}
            >
                {children}
            </Animated.ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    headerLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
});
