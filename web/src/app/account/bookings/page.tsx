import type { Metadata } from "next";

export const metadata: Metadata = { title: "My bookings" };

export default function AccountBookingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black text-gray-900">Bookings</h1>
      <div className="admin-card text-gray-600 font-light">
        No bookings yet. When you pay via Stripe, jobs appear here with live status.
      </div>
    </div>
  );
}
