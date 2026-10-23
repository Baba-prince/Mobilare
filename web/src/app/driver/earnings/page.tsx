import type { Metadata } from "next";

export const metadata: Metadata = { title: "Driver earnings" };

export default function DriverEarningsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black text-gray-900">Earnings</h1>
      <div className="admin-card">
        <p className="text-sm text-gray-600 font-light">
          Completed job payouts will show here after verified deliveries. No earnings yet.
        </p>
      </div>
    </div>
  );
}
