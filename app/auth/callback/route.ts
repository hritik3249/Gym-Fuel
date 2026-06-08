import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT = "/app/dashboard";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? DEFAULT_REDIRECT;
  const { origin } = requestUrl;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
