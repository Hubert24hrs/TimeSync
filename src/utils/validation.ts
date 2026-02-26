/**
 * Input validation utilities for TimeSync
 */

// ─── Email ─────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

// ─── Phone ─────────────────────────────────────────────────────────────

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export function isValidPhone(phone: string): boolean {
    return PHONE_REGEX.test(phone.replace(/[\s\-()]/g, ''));
}

// ─── Timezone ──────────────────────────────────────────────────────────

export function isValidTimezone(tz: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

// ─── Meeting Title ─────────────────────────────────────────────────────

export function isValidMeetingTitle(title: string): { valid: boolean; error?: string } {
    const trimmed = title.trim();
    if (trimmed.length === 0) return { valid: false, error: 'Title is required' };
    if (trimmed.length < 3) return { valid: false, error: 'Title must be at least 3 characters' };
    if (trimmed.length > 150) return { valid: false, error: 'Title must be under 150 characters' };
    return { valid: true };
}

// ─── Description ───────────────────────────────────────────────────────

export function isValidDescription(desc: string): { valid: boolean; error?: string } {
    if (desc.length > 2000) return { valid: false, error: 'Description must be under 2000 characters' };
    return { valid: true };
}

// ─── PIN Code ──────────────────────────────────────────────────────────

export function isValidPin(pin: string): { valid: boolean; error?: string } {
    if (!/^\d{4,6}$/.test(pin)) {
        return { valid: false, error: 'PIN must be 4-6 digits' };
    }
    // Reject obviously weak PINs
    const weak = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123'];
    if (weak.includes(pin)) {
        return { valid: false, error: 'PIN is too simple, choose a stronger one' };
    }
    return { valid: true };
}

// ─── Referral Code ─────────────────────────────────────────────────────

export function isValidReferralCode(code: string): boolean {
    return /^TS-[A-Z0-9]{6}$/.test(code.trim());
}

// ─── URL ───────────────────────────────────────────────────────────────

export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// ─── Name ──────────────────────────────────────────────────────────────

export function isValidName(name: string): { valid: boolean; error?: string } {
    const trimmed = name.trim();
    if (trimmed.length < 1) return { valid: false, error: 'Name is required' };
    if (trimmed.length > 100) return { valid: false, error: 'Name must be under 100 characters' };
    if (/[<>{}\\]/.test(trimmed)) return { valid: false, error: 'Name contains invalid characters' };
    return { valid: true };
}

// ─── Generic ───────────────────────────────────────────────────────────

export function isEmpty(value: string | null | undefined): boolean {
    return !value || value.trim().length === 0;
}

export function isWithinLength(value: string, min: number, max: number): boolean {
    const len = value.trim().length;
    return len >= min && len <= max;
}
