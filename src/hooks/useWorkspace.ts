import { useMemo } from 'react';
import { toParticipant } from '../data/demo';
import { useAppSelector } from '../store/store';
import type { Profile } from '../types';

export function useMe(): Profile | null {
    return useAppSelector((s) => s.workspace.me);
}

export function useWorkspace() {
    return useAppSelector((s) => s.workspace);
}

/** Me + teammates as optimizer participants. */
export function usePeople() {
    const me = useMe();
    const team = useAppSelector((s) => s.workspace.team);
    return useMemo(() => ({ me, team, all: me ? [me, ...team] : team, participants: (me ? [me, ...team] : team).map(toParticipant) }), [me, team]);
}

export function useHour12(): boolean {
    return useAppSelector((s) => s.settings.hour12);
}
