import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase clients are created LAZILY (on first call), never at module scope.
 *
 * Why: this module is imported by client components (e.g. app/Dashboard).
 * Anything constructed at module scope is evaluated as soon as the browser
 * bundle loads — and non-NEXT_PUBLIC env vars (like the service-role key) do
 * not exist in the browser, which caused the infamous
 * "supabaseKey is required" runtime crash. With lazy getters, importing this
 * module is always safe; the client is built on first real use.
 */

let browserClient: SupabaseClient | null = null;

/**
 * Public, client-safe Supabase client (anon key).
 * Safe to call from 'use client' components — only NEXT_PUBLIC_* vars are
 * referenced, which Next.js inlines into the browser bundle at build time.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then RESTART the dev server.'
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}

let adminClient: SupabaseClient | null = null;

/**
 * Server-only admin client (service-role key, bypasses RLS).
 * Never call from client code — the key does not exist in the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in .env.local (server only), then RESTART the dev server.'
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}