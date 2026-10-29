import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store/store';

export default function Entry() {
    const { mode, isOnboarded } = useAppSelector((s) => s.auth);
    const seeded = useAppSelector((s) => s.workspace.seeded);
    if (mode === 'none') return <Redirect href="/welcome" />;
    if (!isOnboarded || !seeded) return <Redirect href="/onboarding" />;
    return <Redirect href="/(tabs)" />;
}
