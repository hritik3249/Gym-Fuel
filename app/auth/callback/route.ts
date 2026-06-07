import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  // If Google auth error, redirect to login with message
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${error}`, request.url)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) {
      return NextResponse.redirect(
        new URL("/auth/login?error=auth_failed", request.url)
      );
    }
  }

  return NextResponse.redirect(new URL("/app/dashboard", request.url));
}
