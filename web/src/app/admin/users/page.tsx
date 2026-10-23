"use client";

import { FormEvent, useEffect, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

type ListedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "driver" | "customer">("admin");

  async function load() {
    setError(null);
    const res = await fetch("/api/auth/users", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Owner access required");
      setUsers([]);
      return;
    }
    setUsers(data.users || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create user");
      setOk(`Created ${data.user.email} (${data.user.role})`);
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="eyebrow">Owner only</p>
        <h1 className="font-display text-3xl font-black text-gray-900 mt-1">Users</h1>
        <p className="text-sm text-gray-600 font-light mt-2">
          Create login credentials for admins, drivers, and customers. Only the claimed owner can do
          this.
        </p>
      </div>

      <form onSubmit={onCreate} className="admin-card space-y-3">
        <p className="font-black text-gray-900">Create login</p>
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
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          minLength={8}
          placeholder="Temporary password (min 8)"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="input-field"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
        >
          <option value="admin">Admin (CRM)</option>
          <option value="driver">Driver</option>
          <option value="customer">Customer</option>
        </select>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="text-sm text-teal font-semibold">{ok}</p> : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create credentials"}
        </button>
      </form>

      <div className="admin-card space-y-3">
        <p className="font-black text-gray-900">Accounts</p>
        {users.length === 0 ? (
          <p className="text-sm text-gray-600 font-light">No users loaded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="py-3 flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  <p className="text-gray-500">{u.email}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-teal self-center">
                  {u.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
