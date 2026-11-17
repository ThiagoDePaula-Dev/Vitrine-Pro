import { createClient as createSupabase } from "@supabase/supabase-js";

/** Cliente anon sem cookies: para leitura pública (RLS só devolve publicados/aprovados). */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabase(url, key, { auth: { persistSession: false } });
}
