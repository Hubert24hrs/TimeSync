import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { isBackendConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/** Null when the app runs without a backend (demo / offline-only builds). */
export const supabase: SupabaseClient | null = isBackendConfigured
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
              storage: Platform.OS === 'web' ? undefined : AsyncStorage,
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: Platform.OS === 'web',
              flowType: 'pkce',
          },
      })
    : null;

export function requireSupabase(): SupabaseClient {
    if (!supabase) throw new Error('Backend is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    return supabase;
}

/** Calls an Edge Function; throws with the server's error message on failure. */
export async function callFunction<T>(name: string, body?: unknown, init: { method?: 'GET' | 'POST'; query?: Record<string, string> } = {}): Promise<T> {
    const method = init.method ?? 'POST';
    const qs = init.query ? `?${new URLSearchParams(init.query).toString()}` : '';
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}${qs}`, {
        method,
        headers: {
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
    return json;
}
