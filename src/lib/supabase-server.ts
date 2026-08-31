import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key (bypasses RLS).
 * Only import this in server components / route handlers / server actions —
 * never expose the service role key to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createSupabaseClient(url, service, {
    auth: { persistSession: false },
  });
}
