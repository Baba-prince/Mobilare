"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ownerClaimed, setOwnerClaimed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setOwnerClaimed(Boolean(d.ownerClaimed)))
      .catch(() => setOwnerClaimed(true));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed");
      const dest =
        next && next.startsWith("/")
          ? next
          : data.redirect || "/portal";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6">
      <div>
        <p className="eyebrow text-teal-bright mb-2">Welcome back</p>
        <h1 className="font-display text-3xl font-black">Sign in</h1>
        <p className="text-gray-300 font-light mt-2 text-sm">
          CRM, driver, and customer portals require a login created by the owner.
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
        {error ? <p className="text-red-300 text-sm">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {ownerClaimed === false ? (
        <p className="text-sm text-gray-400">
          First time setup?{" "}
          <Link href="/auth/claim-owner" className="text-teal-bright font-semibold">
            Claim owner account
          </Link>
        </p>
      ) : (
        <p className="text-sm text-gray-400">
          Need access? Ask the owner to create your login from Admin → Users.
        </p>
      )}
    </div>
  );
}
