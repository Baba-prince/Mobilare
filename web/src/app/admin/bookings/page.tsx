import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin bookings" };

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Bookings</h1>
      <div className="admin-card">
        <p className="text-sm text-gray-600 font-light">
          Paid bookings from Stripe Checkout will list here. No bookings yet.
        </p>
      </div>
    </div>
  );
}
