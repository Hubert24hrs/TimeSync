import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConsentModal } from '../src/components/Monetization';
import { syncCloudWorkspace } from '../src/data/api';
import { supabase } from '../src/lib/supabase';
import { logout, signedIn } from '../src/store/slices/authSlice';
import { persistor, store, useAppDispatch, useAppSelector } from '../src/store/store';
import { palette, ThemeProvider, useTheme } from '../src/theme';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });

/** Keeps the Supabase session and the offline workspace cache in sync (cloud mode only). */
function CloudSync() {
    const dispatch = useAppDispatch();
    const mode = useAppSelector((s) => s.auth.mode);
    useEffect(() => {
        if (!supabase) return;
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) dispatch(signedIn({ userId: session.user.id, email: session.user.email ?? null }));
            if (event === 'SIGNED_OUT' && store.getState().auth.mode === 'cloud') dispatch(logout());
        });
        return () => data.subscription.unsubscribe();
    }, [dispatch]);
    useQuery({ queryKey: ['workspace'], queryFn: syncCloudWorkspace, enabled: mode === 'cloud', refetchInterval: 5 * 60_000 });
    return null;
}

function ThemedStack() {
    const { c, isDark } = useTheme();
    const modal = { presentation: 'modal' as const, animation: 'slide_from_bottom' as const };
    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'fade_from_bottom' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                <Stack.Screen name="new-meeting" options={modal} />
                <Stack.Screen name="paywall" options={modal} />
                <Stack.Screen name="event-type/[id]" options={modal} />
            </Stack>
            <ConsentModal />
        </>
    );
}

function Loading() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.navy }}>
            <ActivityIndicator color={palette.violet} size="large" />
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
    if (!fontsLoaded) return <Loading />;
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Provider store={store}>
                <PersistGate loading={<Loading />} persistor={persistor}>
                    <QueryClientProvider client={queryClient}>
                        <ThemeProvider>
                            <CloudSync />
                            <ThemedStack />
                        </ThemeProvider>
                    </QueryClientProvider>
                </PersistGate>
            </Provider>
        </GestureHandlerRootView>
    );
}
