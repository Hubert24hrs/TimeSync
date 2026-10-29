// Public runtime configuration (EXPO_PUBLIC_* only; secrets never ship in the app).
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const BOOKING_ORIGIN = (process.env.EXPO_PUBLIC_BOOKING_ORIGIN ?? 'https://timesync.app').replace(/\/$/, '');

export const isBackendConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20;

export function bookingUrl(username: string, slug: string): string {
    return `${BOOKING_ORIGIN}/${username}/${slug}`;
}
