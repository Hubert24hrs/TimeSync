import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/** Asks for permission and stores this device's Expo push token for booking reminders. */
export async function registerForPush(userId: string): Promise<{ ok: boolean; message: string }> {
    if (Platform.OS === 'web') return { ok: false, message: 'Push reminders are available in the iOS and Android apps; web gets email reminders.' };
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return { ok: false, message: 'Notifications are turned off for TimeSync in system settings.' };
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) return { ok: false, message: 'Push needs an EAS project id (run `eas init`).' };
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (supabase) {
        const { error } = await supabase.from('push_tokens').upsert({ user_id: userId, token });
        if (error) return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Reminders will arrive on this device.' };
}
