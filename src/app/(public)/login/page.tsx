"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Email/password login via Supabase Auth. Accounts are created by an admin in
// the Supabase dashboard (no public sign-up — this is an internal team tool).
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hero-navy hidden flex-col justify-between p-12 text-white lg:flex">
        <Brand variant="light" />
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            One source of truth
            <br />
            for the whole core team.
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            Sign in to see what&rsquo;s on your plate, update your tasks, and keep the
            team&rsquo;s progress honest.
          </p>
        </div>
        <p className="text-sm text-white/50">SJMSOM · IIT Bombay</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-paper px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="mt-8 lg:mt-0">
            <h2 className="font-display text-2xl font-semibold text-ink">Team login</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the email and password set up for you.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sjmsom.in"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to public dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary during prerender.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <LoginForm />
    </Suspense>
  );
}

