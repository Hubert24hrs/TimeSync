import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { store } from '../store/store';

const enabled = () => Platform.OS !== 'web' && store.getState().settings.hapticsEnabled;

export const haptics = {
    tap: () => enabled() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
    select: () => enabled() && Haptics.selectionAsync().catch(() => undefined),
    success: () => enabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
    warning: () => enabled() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined),
};
