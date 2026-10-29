// Closes a group poll, picks the winner (most yes, then fewest no, then earliest) and books it:
// writes the meeting to the owner's calendars with every voter invited.
//   POST { pollId }
import { z } from 'zod';
import { pollWinner } from '../../../src/engine/index.ts';
import { createCalendarEvents } from '../_shared/calendar.ts';
import { HttpError, handler, json, readJson, requireUser, serviceClient } from '../_shared/http.ts';
import { dispatchWebhooks } from '../_shared/notify.ts';

Deno.serve(
    handler(async (req) => {
        if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
        const user = await requireUser(req);
        const parsed = z.object({ pollId: z.uuid() }).safeParse(await readJson(req));
        if (!parsed.success) throw new HttpError(400, 'Invalid request');
        const db = serviceClient();

        const { data: poll } = await db.from('polls').select('*').eq('id', parsed.data.pollId).eq('owner_id', user.id).maybeSingle();
        if (!poll) throw new HttpError(404, 'Poll not found');
        if (poll.status !== 'open') throw new HttpError(409, 'Poll is already closed');

        const [{ data: options }, { data: votes }] = await Promise.all([
            db.from('poll_options').select('id, start_at, end_at').eq('poll_id', poll.id),
            db.from('poll_votes').select('voter_id, option_id, answer').eq('poll_id', poll.id),
        ]);
        const opts = (options ?? []).map((o: { id: string; start_at: string; end_at: string }) => ({ id: o.id, start: Date.parse(o.start_at), end: Date.parse(o.end_at) }));
        const winner = pollWinner(
            opts,
            (votes ?? []).map((v: { voter_id: string; option_id: string; answer: 'yes' | 'maybe' | 'no' }) => ({ voterId: v.voter_id, optionId: v.option_id, answer: v.answer })),
        );
        if (!winner) {
            await db.from('polls').update({ status: 'closed' }).eq('id', poll.id);
            return json({ status: 'closed', winner: null });
        }

        const voterIds = [...new Set((votes ?? []).filter((v: { option_id: string; answer: string }) => v.option_id === winner.id && v.answer !== 'no').map((v: { voter_id: string }) => v.voter_id))];
        const attendees: { email: string; name: string }[] = [];
        for (const id of voterIds.filter((id) => id !== user.id)) {
            const { data } = await db.auth.admin.getUserById(id);
            if (data.user?.email) attendees.push({ email: data.user.email, name: (data.user.user_metadata?.full_name as string) ?? data.user.email });
        }
        const { meetingUrl } = await createCalendarEvents(db, user.id, {
            requestId: poll.id,
            title: poll.title,
            description: 'Scheduled from a TimeSync group poll.',
            start: new Date(winner.start).toISOString(),
            end: new Date(winner.end).toISOString(),
            attendees,
            video: true,
        });
        await db.from('polls').update({ status: 'booked', winner_option_id: winner.id }).eq('id', poll.id);
        await dispatchWebhooks(db, user.id, 'poll.booked', { pollId: poll.id, title: poll.title, start: new Date(winner.start).toISOString(), attendees: attendees.length + 1 });
        return json({ status: 'booked', winner: { id: winner.id, start: new Date(winner.start).toISOString(), end: new Date(winner.end).toISOString() }, meetingUrl, invited: attendees.length });
    }),
);
