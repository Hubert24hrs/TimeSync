import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { BOOKING_ORIGIN } from './config';
import { callFunction } from './supabase';

// Calendar OAuth (authorization-code flow). The consent screen redirects back to the web app's
// /integrations page, which hands the code to the calendar-sync Edge Function; client secrets and
// tokens never reach the app. On iOS/Android this opens the web app to finish connecting.

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const MICROSOFT_CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? '';

export type CalendarProvider = 'google' | 'outlook';

export const calendarConnectConfigured = (p: CalendarProvider) => (p === 'google' ? GOOGLE_CLIENT_ID : MICROSOFT_CLIENT_ID).length > 0;

function redirectUri(): string {
    return `${Platform.OS === 'web' ? window.location.origin : BOOKING_ORIGIN}/integrations`;
}

export async function startCalendarConnect(provider: CalendarProvider): Promise<void> {
    const redirect = encodeURIComponent(redirectUri());
    const url =
        provider === 'google'
            ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&access_type=offline&prompt=consent&state=google&scope=${encodeURIComponent('openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy')}`
            : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MICROSOFT_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&state=outlook&scope=${encodeURIComponent('offline_access openid email User.Read Calendars.ReadWrite')}`;
    if (Platform.OS === 'web') window.location.assign(url);
    else await WebBrowser.openBrowserAsync(url);
}

export async function finishCalendarConnect(provider: CalendarProvider, code: string): Promise<void> {
    await callFunction('calendar-sync', { action: 'connect', provider, code, redirectUri: redirectUri() });
}

export async function syncCalendars(): Promise<void> {
    await callFunction('calendar-sync', { action: 'sync' });
}
