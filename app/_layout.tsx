import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../src/store/store';
import { ThemeProvider } from '../src/theme';
import { colors } from '../src/theme/colors';
import { ConsentModal } from '../src/components/molecules/ConsentModal';

function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        SpaceGrotesk_500Medium,
        SpaceGrotesk_700Bold,
        JetBrainsMono_400Regular,
        JetBrainsMono_700Bold,
    });

    if (!fontsLoaded) {
        return <LoadingScreen />;
    }

    return (
        <GestureHandlerRootView style={styles.root}>
            <Provider store={store}>
                <PersistGate loading={<LoadingScreen />} persistor={persistor}>
                    <ThemeProvider>
                        <StatusBar style="light" />
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: { backgroundColor: colors.dark.bg },
                                animation: 'slide_from_right',
                            }}
                        >
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                            <Stack.Screen name="cultural-calendar" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                            <Stack.Screen name="meeting-optimizer" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                            <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                            <Stack.Screen name="referral" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                        </Stack>
                        <ConsentModal />
                    </ThemeProvider>
                </PersistGate>
            </Provider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dark.bg },
});
