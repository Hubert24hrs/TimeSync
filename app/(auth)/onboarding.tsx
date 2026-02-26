import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, useAnimatedScrollHandler, interpolate, Extrapolation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { setOnboarded, setUser } from '../../src/store/slices/authSlice';
import { setChronotypeResult } from '../../src/store/slices/aiSlice';
import { GlassButton } from '../../src/components/atoms/GlassButton';
import { onboardingSlides, currentUser } from '../../src/constants/mockData';
import { chronotypeQuizOptions, chronotypes } from '../../src/constants/chronotypes';
import { colors } from '../../src/theme/colors';
import { fontFamilies, fontSizes } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { Chronotype } from '../../src/types';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedChronotype, setSelectedChronotype] = useState<Chronotype | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollX = useSharedValue(0);
    const totalPages = onboardingSlides.length + 1; // slides + chronotype quiz

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const goToNext = () => {
        if (currentPage < totalPages - 1) {
            const nextPage = currentPage + 1;
            scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
            setCurrentPage(nextPage);
        }
    };

    const handleComplete = () => {
        if (selectedChronotype) {
            dispatch(setChronotypeResult(chronotypes[selectedChronotype]));
        }
        dispatch(setUser({ ...currentUser, chronotype: selectedChronotype || 'bear' }));
        dispatch(setOnboarded(true));
        router.replace('/(tabs)');
    };

    return (
        <LinearGradient colors={[colors.dark.bg, '#1A1030']} style={styles.container}>
            <Animated.ScrollView
                ref={scrollViewRef as React.RefObject<Animated.ScrollView>}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const page = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentPage(page);
                }}
            >
                {/* Feature slides */}
                {onboardingSlides.map((slide, index) => (
                    <View key={slide.id} style={styles.slide}>
                        <LinearGradient
                            colors={slide.gradient as unknown as string[]}
                            style={styles.iconBg}
                        >
                            <Text style={styles.slideIcon}>{slide.icon}</Text>
                        </LinearGradient>
                        <Text style={styles.slideTitle}>{slide.title}</Text>
                        <Text style={styles.slideDescription}>{slide.description}</Text>
                    </View>
                ))}

                {/* Chronotype Quiz */}
                <View style={styles.slide}>
                    <Text style={styles.quizTitle}>What's Your Chronotype?</Text>
                    <Text style={styles.quizSubtitle}>This helps us optimize your schedule</Text>
                    <View style={styles.quizOptions}>
                        {chronotypeQuizOptions.map((option) => (
                            <Pressable
                                key={option.type}
                                onPress={() => setSelectedChronotype(option.type)}
                            >
                                <LinearGradient
                                    colors={selectedChronotype === option.type
                                        ? [option.color + '40', option.color + '20']
                                        : [colors.dark.card, colors.dark.elevated]}
                                    style={[
                                        styles.quizOption,
                                        selectedChronotype === option.type && { borderColor: option.color },
                                    ]}
                                >
                                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.optionTitle}>{option.title}</Text>
                                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                                        <Text style={styles.optionDescription}>{option.description}</Text>
                                    </View>
                                </LinearGradient>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Animated.ScrollView>

            {/* Progress dots */}
            <View style={styles.dotsContainer}>
                {Array.from({ length: totalPages }).map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, currentPage === i && styles.dotActive]}
                    />
                ))}
            </View>

            {/* Bottom actions */}
            <View style={styles.bottomActions}>
                {currentPage < totalPages - 1 ? (
                    <>
                        <Pressable onPress={handleComplete}>
                            <Text style={styles.skipText}>Skip</Text>
                        </Pressable>
                        <GlassButton title="Next" onPress={goToNext} variant="primary" size="md" />
                    </>
                ) : (
                    <GlassButton
                        title="Get Started 🚀"
                        onPress={handleComplete}
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!selectedChronotype}
                    />
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
    iconBg: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
    slideIcon: { fontSize: 56 },
    slideTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.display, color: '#FFF', textAlign: 'center', marginBottom: spacing.lg },
    slideDescription: { fontFamily: fontFamilies.primary, fontSize: fontSizes.lg, color: colors.glass.textMuted, textAlign: 'center', lineHeight: 26, maxWidth: 300 },
    quizTitle: { fontFamily: fontFamilies.displayBold, fontSize: fontSizes.xxxl, color: '#FFF', textAlign: 'center', marginBottom: spacing.sm, marginTop: spacing.huge },
    quizSubtitle: { fontFamily: fontFamilies.primary, fontSize: fontSizes.md, color: colors.glass.textMuted, textAlign: 'center', marginBottom: spacing.xxl },
    quizOptions: { width: '100%', gap: spacing.md },
    quizOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.glass.border, gap: spacing.lg },
    optionEmoji: { fontSize: 36 },
    optionTextContainer: { flex: 1 },
    optionTitle: { fontFamily: fontFamilies.primaryBold, fontSize: fontSizes.lg, color: '#FFF' },
    optionSubtitle: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.sm, color: colors.primary.light, marginBottom: 4 },
    optionDescription: { fontFamily: fontFamilies.primary, fontSize: fontSizes.sm, color: colors.glass.textMuted, lineHeight: 18 },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.glass.border },
    dotActive: { backgroundColor: colors.primary.main, width: 24 },
    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
    skipText: { fontFamily: fontFamilies.primaryMedium, fontSize: fontSizes.lg, color: colors.glass.textMuted },
});
