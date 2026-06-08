const PLACEHOLDER_URL = "https://example.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_KEY;

/** True once real Supabase credentials are configured — lets local/demo runs skip auth enforcement. */
export function hasSupabaseConfig() {
  return SUPABASE_URL !== PLACEHOLDER_URL && SUPABASE_ANON_KEY !== PLACEHOLDER_KEY;
}
