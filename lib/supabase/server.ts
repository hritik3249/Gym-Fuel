import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Server-side Supabase client backed by Next.js cookies — for use in Server Components, actions, and routes. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Setting cookies from a Server Component is a no-op when middleware
          // already refreshes the session — safe to ignore here.
        }
      }
    }
  });
}
