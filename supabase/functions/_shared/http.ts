import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...headers } });
}

export function env(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new HttpError(500, `Server is missing ${name}`);
    return value;
}

/** Wraps a handler with CORS preflight and uniform error responses (no stack traces leak). */
export function handler(fn: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
    return async (req) => {
        if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
        try {
            return await fn(req);
        } catch (err) {
            if (err instanceof HttpError) return json({ error: err.message }, err.status);
            console.error(err);
            return json({ error: 'Something went wrong' }, 500);
        }
    };
}

export function serviceClient(): SupabaseClient {
    return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
}

/** Resolves the signed-in user from the Authorization header, or throws 401. */
export async function requireUser(req: Request): Promise<{ id: string; email?: string }> {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) throw new HttpError(401, 'Sign in required');
    const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
        global: { headers: { Authorization: auth } },
        auth: { persistSession: false },
    });
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new HttpError(401, 'Sign in required');
    return { id: data.user.id, email: data.user.email };
}

/** Stable, non-reversible key for per-IP rate limits (we never store raw IPs). */
export async function ipKey(req: Request, scope: string): Promise<string> {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${scope}:${ip}`));
    return `${scope}:${Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function rateLimit(db: SupabaseClient, key: string, windowSeconds: number, max: number): Promise<void> {
    const { data, error } = await db.rpc('hit_rate_limit', { p_key: key, p_window_seconds: windowSeconds, p_max: max });
    if (error) throw error;
    if (data !== true) throw new HttpError(429, 'Too many requests, please try again later');
}

export async function readJson(req: Request, maxBytes = 32_000): Promise<unknown> {
    const text = await req.text();
    if (text.length > maxBytes) throw new HttpError(413, 'Request too large');
    try {
        return JSON.parse(text);
    } catch {
        throw new HttpError(400, 'Invalid JSON');
    }
}

export async function hmacHex(secret: string, data: string): Promise<string> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}
