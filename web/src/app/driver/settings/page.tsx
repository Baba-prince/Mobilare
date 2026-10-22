import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Driver settings" };

export default function DriverSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black text-gray-900">Settings</h1>
      <form className="admin-card space-y-3 max-w-lg">
        <input className="input-field" placeholder="Vehicle type" />
        <input className="input-field" placeholder="Home postcode" />
        <input className="input-field" placeholder="Phone" />
        <button type="button" className="btn-primary">
          Save
        </button>
      </form>
      <div className="admin-card max-w-lg space-y-3">
        <p className="font-black text-gray-900">Message CRM</p>
        <p className="text-sm text-gray-600 font-light">
          Reach dispatch about vehicles, corridors, or account issues from the driver desk thread.
        </p>
        <Link href="/driver/messages" className="btn-secondary inline-flex">
          Open messages
        </Link>
      </div>
    </div>
  );
}
