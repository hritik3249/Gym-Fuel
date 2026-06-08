"use client";

import Link from "next/link";
import { Chrome, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

export type AuthMode = "login" | "signup" | "reset";

const TITLES: Record<AuthMode, string> = {
  login: "Welcome back",
  signup: "Create your account",
  reset: "Reset password"
};

const SUBMIT_LABELS: Record<AuthMode, string> = {
  login: "Log in",
  signup: "Sign up",
  reset: "Send reset link"
};

// Gives Supabase time to persist the session cookie before the hard redirect.
const POST_LOGIN_REDIRECT_DELAY_MS = 500;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  async function handlePasswordReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/login`
    });
    setMessage(error?.message ?? "Password reset email sent. Check your inbox.");
  }

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Check your email to confirm your account, then log in.");
  }

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      await new Promise((resolve) => setTimeout(resolve, POST_LOGIN_REDIRECT_DELAY_MS));
      window.location.replace("/app/dashboard");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "reset") await handlePasswordReset();
    else if (mode === "signup") await handleSignup();
    else await handleLogin();

    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" }
      }
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{TITLES[mode]}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            {mode !== "reset" && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}
            <Button disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {SUBMIT_LABELS[mode]}
            </Button>
          </form>

          {mode !== "reset" && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={handleGoogleLogin} disabled={loading}>
                <Chrome className="size-4" />
                Continue with Google
              </Button>
            </>
          )}

          {message && <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">{message}</p>}

          <div className="mt-5 flex justify-between text-sm">
            {mode !== "login" ? (
              <Link href="/auth/login" className="text-primary hover:underline">Log in</Link>
            ) : (
              <Link href="/auth/signup" className="text-primary hover:underline">Create account</Link>
            )}
            <Link href="/auth/reset-password" className="text-primary hover:underline">Forgot password?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
