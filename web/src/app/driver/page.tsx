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
      <div className="admin-card">
        <p className="font-black text-gray-900 mb-2">Getting started</p>
        <p className="text-sm text-gray-600 font-light mb-4">
          Share your live location, open the jobs board when dispatch releases work, and message CRM
          for corridor or POD questions.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/driver/messages" className="btn-primary">
            Open messages
          </Link>
          <Link href="/driver/jobs" className="btn-secondary">
            View jobs
          </Link>
          <Link href="/driver/earnings" className="btn-secondary">
            Earnings
          </Link>
        </div>
      </div>
    </div>
  );
}
