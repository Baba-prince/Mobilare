"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { LiveTrackPanel } from "@/components/tracking/LiveTrackPanel";

export default function AccountBookingsPage() {
  const [ref, setRef] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-600 font-light mt-1">
            Track any paid booking on a live Google map (pickup, route, driver).
          </p>
        </div>
        <Link href="/book" className="btn-primary">
          New booking
        </Link>
      </div>

      <div className="admin-card space-y-3 max-w-xl">
        <label className="block text-sm font-semibold text-gray-700">
          Track a booking
          <input
            className="input-field mt-1"
            placeholder="MB-XXXXXXXX"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        </label>
        <p className="text-xs text-gray-500">
          Paid bookings appear here after Stripe webhook. You can also open{" "}
          <Link href="/track" className="text-teal font-semibold">
            /track
          </Link>
          .
        </p>
      </div>

      {ref.trim() ? (
        <Suspense fallback={<p className="text-sm text-gray-500">Loading map…</p>}>
          <LiveTrackPanel key={ref.trim()} initialRef={ref.trim()} compact />
        </Suspense>
      ) : (
        <div className="admin-card text-gray-600 font-light">
          Enter a booking reference above to open the live Google track map.
        </div>
      )}
    </div>
  );
}
