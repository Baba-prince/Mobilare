import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin drivers" };

export default function AdminDriversPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end gap-4">
        <h1 className="font-display text-3xl font-black text-gray-900">Drivers</h1>
      </div>
      <div className="admin-card">
        <p className="text-sm text-gray-600 font-light">
          Approved and pending drivers will list here once they sign up. No drivers yet.
        </p>
      </div>
    </div>
  );
}
