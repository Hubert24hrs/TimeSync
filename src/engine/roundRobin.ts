export interface HostLoad {
    hostId: string;
    /** Bookings assigned in the balancing period (e.g. this week). */
    bookings: number;
    /** Higher priority wins ties; default 0. */
    priority?: number;
    lastAssignedAt?: number;
    /** Relative capacity, e.g. 0.5 for a half-time host. Default 1. */
    weight?: number;
}

/**
 * Load-balanced round-robin: picks the free host with the lowest weighted load, then highest
 * priority, then the one assigned longest ago, then by id for determinism.
 */
export function pickHost(loads: HostLoad[], freeHostIds: string[]): string | null {
    const free = loads.filter((l) => freeHostIds.includes(l.hostId));
    if (free.length === 0) return null;
    free.sort((a, b) => {
        const la = a.bookings / (a.weight ?? 1);
        const lb = b.bookings / (b.weight ?? 1);
        if (la !== lb) return la - lb;
        if ((b.priority ?? 0) !== (a.priority ?? 0)) return (b.priority ?? 0) - (a.priority ?? 0);
        if ((a.lastAssignedAt ?? 0) !== (b.lastAssignedAt ?? 0)) return (a.lastAssignedAt ?? 0) - (b.lastAssignedAt ?? 0);
        return a.hostId.localeCompare(b.hostId);
    });
    return free[0].hostId;
}
