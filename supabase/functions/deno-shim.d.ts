// Type shim so the Edge Functions can be type-checked with the project's tsc (npm run typecheck:functions).
// At runtime Supabase provides the real Deno globals.
declare namespace Deno {
    const env: { get(key: string): string | undefined };
    function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
