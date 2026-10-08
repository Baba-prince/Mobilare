import type { Metadata } from "next";

export const metadata: Metadata = { title: "Driver earnings" };

export default function DriverEarningsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black text-gray-900">Earnings</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="admin-card">
          <p className="text-sm text-gray-500">This week</p>
          <p className="text-3xl font-black text-gray-900 mt-1">£0.00</p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-500">Pending payout</p>
          <p className="text-3xl font-black text-gray-900 mt-1">£0.00</p>
        </div>
      </div>
    </div>
  );
}
