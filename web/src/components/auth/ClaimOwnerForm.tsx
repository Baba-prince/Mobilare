"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function ClaimOwnerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => {
        setBlocked(Boolean(d.ownerClaimed));
        setChecking(false);
      })
      .catch(() => {
        setBlocked(true);
        setChecking(false);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/claim-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8">
        <p className="text-gray-300">Checking owner status…</p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-4">
        <h1 className="font-display text-3xl font-black">Owner already claimed</h1>
        <p className="text-gray-300 font-light text-sm">
          This one-time setup is complete. Sign in with your owner credentials, or ask the owner to
          create a login for you.
        </p>
        <Link href="/auth/sign-in" className="btn-primary inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6">
      <div>
        <p className="eyebrow text-teal-bright mb-2">One-time setup</p>
        <h1 className="font-display text-3xl font-black">Claim owner account</h1>
        <p className="text-gray-300 font-light mt-2 text-sm">
          Create the first admin owner login. This can only be done once. Afterward, only you can
          create credentials for other users from Admin → Users.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input-field"
          placeholder="Full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input-field"
          type="email"
          placeholder="Owner email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          minLength={8}
          placeholder="Password (min 8 chars)"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input-field"
          type="password"
          minLength={8}
          placeholder="Confirm password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? <p className="text-red-300 text-sm">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Claiming…" : "Claim owner & enter CRM"}
        </button>
      </form>
    </div>
  );
}
