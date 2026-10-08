import type { Metadata } from "next";

export const metadata: Metadata = { title: "Driver settings" };

export default function DriverSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black text-gray-900">Settings</h1>
      <form className="admin-card space-y-3 max-w-lg">
        <input className="input-field" placeholder="Vehicle type" />
        <input className="input-field" placeholder="Home postcode" />
        <input className="input-field" placeholder="Phone" />
        <button type="button" className="btn-primary">
          Save
        </button>
      </form>
    </div>
  );
}
