import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Driver dashboard" };

export default function DriverHomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-gray-900">Driver dashboard</h1>
          <p className="text-sm text-gray-600 font-light mt-1">
            Jobs, earnings, and live chat with CRM / dispatch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/driver/location" className="btn-primary">
            Live map
          </Link>
          <Link href="/driver/messages" className="btn-secondary">
            Message CRM
          </Link>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Jobs board", "Open Jobs"],
          ["Dispatch chat", "Live"],
          ["Portal", "Switch entrance"],
        ].map(([l, v]) => (
          <div key={l} className="admin-card">
            <p className="text-sm text-gray-500">{l}</p>
            <p className="text-lg font-black text-gray-900 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="admin-card">
        <p className="font-black text-gray-900 mb-2">Talk to dispatch</p>
        <p className="text-sm text-gray-600 font-light mb-4">
          Corridor coverage, POD issues, and job questions go straight to the CRM Tri-inbox —
          same pattern as RoadAngel driver ↔ CRM.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/driver/messages" className="btn-primary">
            Open messages
          </Link>
          <Link href="/driver/jobs" className="btn-secondary">
            View jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
