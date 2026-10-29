import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { requireSupabase, supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

/** Supabase OAuth (PKCE). Web redirects in-place; native uses an auth session and exchanges the code. */
export async function signInWithProvider(provider: OAuthProvider): Promise<{ userId: string; email: string | null } | null> {
    const db = requireSupabase();
    const redirectTo = Platform.OS === 'web' ? `${window.location.origin}/` : Linking.createURL('auth-callback');
    const { data, error } = await db.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' } });
    if (error) throw error;
    if (Platform.OS === 'web') return null; // the page navigates away and comes back signed in
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null;
    const code = new URL(result.url).searchParams.get('code');
    if (!code) throw new Error('Sign-in was cancelled');
    const { data: session, error: exchangeError } = await db.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return { userId: session.user.id, email: session.user.email ?? null };
}

export async function currentSession(): Promise<{ userId: string; email: string | null } | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session ? { userId: data.session.user.id, email: data.session.user.email ?? null } : null;
}

export async function signOut(): Promise<void> {
    await supabase?.auth.signOut();
}
