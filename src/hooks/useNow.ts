import { useEffect, useState } from 'react';

/** Current time, re-rendering every `intervalMs` (aligned to the next tick). */
export function useNow(intervalMs = 1000): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        const first = setTimeout(() => {
            setNow(Date.now());
            timer = setInterval(() => setNow(Date.now()), intervalMs);
        }, intervalMs - (Date.now() % intervalMs));
        return () => {
            clearTimeout(first);
            if (timer) clearInterval(timer);
        };
    }, [intervalMs]);
    return now;
}
