"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (authError) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-surface p-gutter-mobile">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Icon name="solar_power" className="text-primary text-5xl mb-3" filled />
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-primary text-center">
            Helios Engineering System
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-border-subtle rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container text-body-sm rounded-lg px-3 py-2">
              <Icon name="error" className="text-[18px]" />
              {error}
            </div>
          )}

          <div>
            <label className="font-label text-data-label text-outline uppercase block mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-touch-target rounded-lg border border-outline-variant px-3 text-body-base focus:outline-none focus:border-l-2 focus:border-l-secondary-fixed-dim focus:border-primary"
              placeholder="you@helios.dev"
            />
          </div>

          <div>
            <label className="font-label text-data-label text-outline uppercase block mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-touch-target rounded-lg border border-outline-variant px-3 text-body-base focus:outline-none focus:border-l-2 focus:border-l-secondary-fixed-dim focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
            {!submitting && <Icon name="login" />}
          </button>
        </form>

        <div className="mt-6 text-body-sm text-on-surface-variant bg-surface-container-low border border-border-subtle rounded-lg p-4">
          <p className="font-label text-data-label uppercase text-outline mb-2">Demo accounts</p>
          <p>field@helios.dev / field1234 — Field Executive</p>
          <p>manager@helios.dev / manager1234 — Manager</p>
          <p>admin@helios.dev / admin1234 — Admin</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
