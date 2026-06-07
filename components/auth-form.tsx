"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Loader2, Mail } from "lucide-react";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

function AuthFormInner({ mode }: { mode: "login" | "signup" | "reset" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    authError ? "Authentication failed. Please try again." : ""
  );
  const supabase = createClient();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/login`
      });
      setMessage(error?.message ?? "Password reset email sent. Check your inbox.");
      setLoading(false);
      return;
    }

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`
            }
          });

    const { error } = await action;
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup") {
      setMessage("Check your email to confirm your account.");
      return;
    }

    router.push("/app/dashboard");
    router.refresh();
  }

  async function googleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  const title =
    mode === "login" ? "Welcome back" :
    mode === "signup" ? "Create your account" :
    "Reset password";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "reset" && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              </div>
            )}
            <Button disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
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
              <Button className="w-full" variant="outline" onClick={googleLogin} disabled={loading}>
                <Chrome className="size-4" />
                Continue with Google
              </Button>
            </>
          )}

          {message && (
            <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">
              {message}
            </p>
          )}

          <div className="mt-5 flex justify-between text-sm">
            {mode !== "login"
              ? <Link href="/auth/login" className="text-primary hover:underline">Log in</Link>
              : <Link href="/auth/signup" className="text-primary hover:underline">Create account</Link>
            }
            <Link href="/auth/reset-password" className="text-primary hover:underline">Forgot password?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" | "reset" }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
