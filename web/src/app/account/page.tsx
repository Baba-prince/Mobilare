import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Customer account" };

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-black text-gray-900">Overview</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Open bookings", "0"],
          ["Delivered", "0"],
          ["Spend (MTD)", "£0"],
        ].map(([l, v]) => (
          <div key={l} className="admin-card">
            <p className="text-sm text-gray-500">{l}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <Link href="/book" className="btn-primary inline-flex">
        Book a delivery
      </Link>
    </div>
  );
}
