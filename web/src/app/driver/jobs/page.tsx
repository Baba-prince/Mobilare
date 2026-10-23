import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Driver jobs" };

export default function DriverJobsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-black text-gray-900">Jobs</h1>
        <Link href="/driver/location" className="btn-primary">
          Open live map
        </Link>
      </div>
      <div className="admin-card">
        <p className="text-sm text-gray-600 font-light">
          Available and assigned jobs will appear here when dispatch releases them.
        </p>
      </div>
    </div>
  );
}
