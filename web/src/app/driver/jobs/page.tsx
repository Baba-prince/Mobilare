import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Driver jobs" };

const demo = [
  { ref: "MB-21B9FFF1", route: "OL84AX → UB109LE", pay: "£42", status: "queued" },
  { ref: "MB-DEMO-002", route: "M1 1AE → M15 4FN", pay: "£28", status: "available" },
];

export default function DriverJobsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-black text-gray-900">Jobs</h1>
        <Link href="/driver/location" className="btn-primary">
          Open live map
        </Link>
      </div>
      <div className="space-y-3">
        {demo.map((j) => (
          <div key={j.ref} className="admin-card flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-black text-gray-900">{j.ref}</p>
              <p className="text-sm text-gray-600">{j.route}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-black text-teal">{j.pay}</p>
              <p className="text-xs text-gray-500 uppercase">{j.status}</p>
              <Link
                href={`/track?ref=${encodeURIComponent(j.ref)}`}
                className="text-xs text-teal font-semibold hover:underline"
              >
                Map route →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
