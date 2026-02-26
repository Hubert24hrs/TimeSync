import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_PREFIX = '__secure_';

/**
 * Hook for encrypted-like secure storage
 * Uses AsyncStorage with a prefix for sensitive keys
 * In production, replace with expo-secure-store for native encrypted storage
 */
export function useSecureStorage() {
    const setSecure = useCallback(async (key: string, value: string): Promise<void> => {
        try {
            // Basic obfuscation - in production use expo-secure-store
            const encoded = btoa(unescape(encodeURIComponent(value)));
            await AsyncStorage.setItem(SECURE_PREFIX + key, encoded);
        } catch (error) {
            console.error('[SecureStorage] Failed to set:', key, error);
        }
    }, []);

    const getSecure = useCallback(async (key: string): Promise<string | null> => {
        try {
            const encoded = await AsyncStorage.getItem(SECURE_PREFIX + key);
            if (!encoded) return null;
            return decodeURIComponent(escape(atob(encoded)));
        } catch (error) {
            console.error('[SecureStorage] Failed to get:', key, error);
            return null;
        }
    }, []);

    const removeSecure = useCallback(async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(SECURE_PREFIX + key);
        } catch (error) {
            console.error('[SecureStorage] Failed to remove:', key, error);
        }
    }, []);

    const clearAllSecure = useCallback(async (): Promise<void> => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const secureKeys = allKeys.filter((k) => k.startsWith(SECURE_PREFIX));
            for (const key of secureKeys) {
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('[SecureStorage] Failed to clear:', error);
        }
    }, []);

    return {
        setSecure,
        getSecure,
        removeSecure,
        clearAllSecure,
    };
}
