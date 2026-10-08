import type { Metadata } from "next";

export const metadata: Metadata = { title: "Driver dashboard" };

export default function DriverHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black text-gray-900">Driver dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Available jobs", "3"],
          ["Active", "0"],
          ["Completed today", "0"],
        ].map(([l, v]) => (
          <div key={l} className="admin-card">
            <p className="text-sm text-gray-500">{l}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <p className="font-black text-gray-900 mb-2">Go online</p>
        <p className="text-sm text-gray-600 font-light mb-4">
          Toggle availability to receive same-day assignments in your corridor.
        </p>
        <button type="button" className="btn-primary">
          Set available
        </button>
      </div>
    </div>
  );
}
