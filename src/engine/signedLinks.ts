// HMAC-SHA256 signed tokens for emailed manage links (reschedule / cancel) and public booking links.
// Signing happens server-side only (Edge Functions hold the secret); the app just forwards tokens.

export interface LinkClaims {
    /** Booking id, or event-type id for signed booking links. */
    sub: string;
    action: 'manage' | 'book';
    /** Expiry, epoch seconds. */
    exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
    if (!secret || secret.length < 32) throw new Error('Link signing secret must be at least 32 characters');
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
}

export async function signLink(claims: LinkClaims, secret: string): Promise<string> {
    const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
    const sig = toBase64Url(await hmac(secret, payload));
    return `${payload}.${sig}`;
}

export async function verifyLink(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): Promise<LinkClaims | null> {
    const [payload, sig, extra] = token.split('.');
    if (!payload || !sig || extra !== undefined) return null;
    let expected: Uint8Array;
    let given: Uint8Array;
    try {
        expected = await hmac(secret, payload);
        given = fromBase64Url(sig);
    } catch {
        return null;
    }
    if (!constantTimeEqual(expected, given)) return null;
    try {
        const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as LinkClaims;
        if (typeof claims.exp !== 'number' || claims.exp < nowSeconds) return null;
        if (claims.action !== 'manage' && claims.action !== 'book') return null;
        return claims;
    } catch {
        return null;
    }
}
