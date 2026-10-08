"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { loadDemoUser, portalForRole, saveDemoUser, UserRole } from "@/lib/auth-demo";
import { createClient } from "@/lib/supabase/client";

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleHint, setRoleHint] = useState<UserRole>("customer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (supabase) {
      const { data, error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }
      const role = (data.user?.user_metadata?.role as UserRole) || "customer";
      router.push(portalForRole(role));
      return;
    }

    const existing = loadDemoUser();
    const user = existing && existing.email === email
      ? existing
      : {
          id: crypto.randomUUID(),
          email,
          fullName: email.split("@")[0] || "User",
          role: roleHint,
        };
    saveDemoUser(user);
    setLoading(false);
    router.push(portalForRole(user.role));
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6">
      <div>
        <p className="eyebrow text-teal-bright mb-2">Welcome back</p>
        <h1 className="font-display text-3xl font-black">Sign in</h1>
        <p className="text-gray-300 font-light mt-2 text-sm">
          Customers, drivers, and admins use the same sign-in. We route you to the right portal.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input-field"
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {!hasSupabaseEnv ? (
          <label className="block text-sm text-gray-300 space-y-2">
            Demo role (no Supabase env)
            <select
              className="input-field"
              value={roleHint}
              onChange={(e) => setRoleHint(e.target.value as UserRole)}
            >
              <option value="customer">Customer</option>
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        ) : null}
        {error ? <p className="text-red-300 text-sm">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-gray-400">
        New here?{" "}
        <Link href="/auth/sign-up" className="text-teal-bright font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  );
}
