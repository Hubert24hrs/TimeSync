import { availableSlots, intersectSlots, unionSlots } from './availability.ts';
import { scoreSlot } from './optimizer.ts';
import { pickHost } from './roundRobin.ts';
import type { AvailabilitySchedule, EventType, Interval, Participant } from './types.ts';

// Slot computation for an event type across its hosts (1:1, group seats, collective, round-robin).
// Shared by the public-booking Edge Function and the app's offline/demo booking page.

export interface HostContext {
    participant: Participant;
    schedule: AvailabilitySchedule;
    busy: Interval[];
    /** Confirmed bookings of this event type, by start, for daily caps and seat counts. */
    bookingsOfType: Interval[];
    load: number;
}

export interface EventContext {
    eventType: EventType;
    hosts: HostContext[];
}

export interface BookableSlot extends Interval {
    hostIds: string[];
    seatsLeft?: number;
}

export function bookableSlots(ctx: EventContext, from: number, to: number, now: number): BookableSlot[] {
    const et = ctx.eventType;
    const perHost = ctx.hosts.map((h) => ({
        hostId: h.participant.id,
        slots: availableSlots({
            schedule: h.schedule,
            rules: et,
            busy: h.busy,
            // Daily caps count meetings: a group session with many seats counts once.
            bookingsOfType: et.kind === 'group' ? [...new Map(h.bookingsOfType.map((b) => [b.start, b])).values()] : h.bookingsOfType,
            from,
            to,
            now,
        }),
    }));

    if (et.kind === 'collective') {
        const ids = perHost.map((p) => p.hostId);
        return intersectSlots(perHost.map((p) => p.slots)).map((s) => ({ ...s, hostIds: ids }));
    }
    if (et.kind === 'round_robin') return unionSlots(perHost);

    const owner = perHost.find((p) => p.hostId === et.ownerId) ?? perHost[0];
    const host = ctx.hosts.find((h) => h.participant.id === owner.hostId)!;
    return owner.slots
        .map((s): BookableSlot => {
            if (et.kind !== 'group' || !et.seats) return { ...s, hostIds: [owner.hostId] };
            const taken = host.bookingsOfType.filter((b) => b.start === s.start).length;
            return { ...s, hostIds: [owner.hostId], seatsLeft: et.seats - taken };
        })
        .filter((s) => s.seatsLeft === undefined || s.seatsLeft > 0);
}

/** Fairness and energy badges for a slot from the invitee's point of view. */
export function slotBadges(ctx: EventContext, slot: BookableSlot, inviteeZone: string) {
    const hosts = ctx.hosts.filter((h) => slot.hostIds.includes(h.participant.id)).map((h) => h.participant);
    const score = scoreSlot([...hosts, { id: 'invitee', name: 'You', timezone: inviteeZone }], slot);
    return { fairness: score.fairnessScore, energy: score.energyScore };
}

export function chooseHost(ctx: EventContext, slot: BookableSlot): string {
    if (ctx.eventType.kind !== 'round_robin') return ctx.eventType.ownerId && slot.hostIds.includes(ctx.eventType.ownerId) ? ctx.eventType.ownerId : slot.hostIds[0];
    const chosen = pickHost(
        ctx.hosts.map((h) => ({ hostId: h.participant.id, bookings: h.load })),
        slot.hostIds,
    );
    if (!chosen) throw new Error('That time was just taken');
    return chosen;
}
