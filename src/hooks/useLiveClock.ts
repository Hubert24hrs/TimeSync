import { useState, useEffect, useRef, useCallback } from 'react';

export function useLiveClock(timezone: string = 'UTC'): string {
    const [time, setTime] = useState<string>(() => formatTime(timezone));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setTime(formatTime(timezone));
        intervalRef.current = setInterval(() => {
            setTime(formatTime(timezone));
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timezone]);

    return time;
}

function formatTime(timezone: string): string {
    try {
        return new Date().toLocaleTimeString('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    } catch {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    }
}

export function useCurrentDate(): { dateString: string; dayName: string; monthDay: string } {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
        dateString: now.toISOString().split('T')[0],
        dayName: days[now.getDay()],
        monthDay: `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
    };
}
