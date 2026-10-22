"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          message: String(fd.get("message") || ""),
          phone: String(fd.get("phone") || ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setThreadId(data.thread_id || null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card-soft bg-teal/5 border-teal/30 space-y-3">
        <p className="font-black text-gray-900">Message received</p>
        <p className="text-sm text-gray-600 font-light">
          Thanks — your message is in the CRM inbox. Our team will reply by email or through the
          customer portal support chat.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/account/messages" className="btn-primary text-sm !py-2 !px-4">
            Open support chat
          </Link>
          <Link href="/admin/messages" className="btn-secondary text-sm !py-2 !px-4">
            CRM inbox
          </Link>
        </div>
        {threadId ? (
          <p className="text-[11px] text-gray-400 font-mono">Ref {threadId.slice(0, 8)}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-soft space-y-4">
      <input name="name" required placeholder="Name" className="input-field" />
      <input name="email" type="email" required placeholder="Email" className="input-field" />
      <input name="phone" type="tel" placeholder="Phone (optional)" className="input-field" />
      <textarea
        name="message"
        required
        rows={4}
        placeholder="How can we help?"
        className="input-field"
        minLength={5}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
