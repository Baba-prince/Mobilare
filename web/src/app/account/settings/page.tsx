import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account settings" };

export default function AccountSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black text-gray-900">Settings</h1>
      <form className="admin-card space-y-3 max-w-lg">
        <input className="input-field" placeholder="Full name" />
        <input className="input-field" placeholder="Company" />
        <input className="input-field" placeholder="Phone" />
        <button type="button" className="btn-primary">
          Save changes
        </button>
      </form>
    </div>
  );
}
