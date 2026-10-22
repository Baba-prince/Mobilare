import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account settings" };

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black text-gray-900">Settings</h1>
      <form className="admin-card space-y-3 max-w-lg">
        <input className="input-field" placeholder="Full name" />
        <input className="input-field" placeholder="Company" />
        <input className="input-field" placeholder="Phone" />
        <button type="button" className="btn-primary">
          Save changes
        </button>
      </form>
      <div className="admin-card max-w-lg space-y-3">
        <p className="font-black text-gray-900">Support from your profile</p>
        <p className="text-sm text-gray-600 font-light">
          Message CRM about billing, delays, or account changes. Threads are stored and visible to
          ops in the admin inbox.
        </p>
        <Link href="/account/messages" className="btn-secondary inline-flex">
          Open support chat
        </Link>
      </div>
    </div>
  );
}
