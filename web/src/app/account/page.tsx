import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Customer account" };

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-gray-900">Overview</h1>
          <p className="text-sm text-gray-600 font-light mt-1">
            Book, track, and message CRM from the same portal.
          </p>
        </div>
        <Link href="/account/messages" className="btn-primary">
          Message CRM
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Open bookings", "Live in Bookings"],
          ["Support", "Chat CRM"],
          ["Portal", "Switch role"],
        ].map(([l, v]) => (
          <div key={l} className="admin-card">
            <p className="text-sm text-gray-500">{l}</p>
            <p className="text-lg font-black text-gray-900 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="admin-card flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="font-black text-gray-900">Need help with a booking?</p>
          <p className="text-sm text-gray-600 font-light mt-1">
            Open Support — your message lands in the CRM inbox instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/book" className="btn-primary">
            Book a delivery
          </Link>
          <Link href="/account/messages" className="btn-secondary">
            Open support
          </Link>
        </div>
      </div>
    </div>
  );
}
