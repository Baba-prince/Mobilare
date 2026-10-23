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
      <div className="admin-card flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="font-black text-gray-900">Need a delivery?</p>
          <p className="text-sm text-gray-600 font-light mt-1">
            Get a quote, pay in full, then track with your booking reference. Support chat lands in
            the CRM inbox.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/book" className="btn-primary">
            Book a delivery
          </Link>
          <Link href="/account/bookings" className="btn-secondary">
            Track a booking
          </Link>
          <Link href="/account/messages" className="btn-secondary">
            Open support
          </Link>
        </div>
      </div>
    </div>
  );
}
