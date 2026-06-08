import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { hasSupabaseConfig, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export const runtime = "nodejs";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIX = "/app";
const AUTH_PREFIX = "/auth";
const AUTH_CALLBACK_PATH = "/auth/callback";
const LOGIN_PATH = "/auth/login";
const DASHBOARD_PATH = "/app/dashboard";

export async function middleware(request: NextRequest) {
  // Without real Supabase credentials, run in demo mode and skip route protection.
  if (!hasSupabaseConfig()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      }
    }
  });

  // Always call getUser() (not getSession()) so the auth cookie is refreshed server-side.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith(PROTECTED_PREFIX) && !user) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (pathname.startsWith(AUTH_PREFIX) && pathname !== AUTH_CALLBACK_PATH && user) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every route except static assets, image optimization, and PWA files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|webmanifest)$).*)"
  ]
};
