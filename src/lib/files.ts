import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { buildIcs, type IcsEvent } from '../engine';

/** Saves an .ics file: a download on web, the share sheet on iOS/Android. */
export async function exportIcs(filename: string, events: IcsEvent[]): Promise<void> {
    const content = buildIcs(events);
    if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
    }
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(content);
    await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'com.apple.ical.ics', dialogTitle: 'Add to calendar' });
}
