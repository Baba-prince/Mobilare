import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin" };

const stats = [
  { label: "Paid bookings (7d)", value: "—", hint: "Updates when Stripe payments land" },
  { label: "Revenue (7d)", value: "—", hint: "VAT incl." },
  { label: "Active drivers", value: "—", hint: "From live GPS / approvals" },
  { label: "Jobs in queue", value: "—", hint: "Needs assign" },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-gray-900 mt-2">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/messages" className="btn-primary">
            CRM inbox
          </Link>
          <Link href="/admin/map" className="btn-secondary">
            Dispatch map
          </Link>
          <Link href="/admin/bookings" className="btn-secondary">
            View bookings
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="admin-card">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{s.value}</p>
            <p className="text-xs text-teal mt-2 font-semibold">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="admin-card">
          <p className="font-black text-gray-900 mb-4">Recent activity</p>
          <p className="text-sm text-gray-600 font-light">
            Paid bookings, AI leads, and contact messages will appear here as they come in. Nothing
            yet.
          </p>
        </div>
        <div className="admin-card">
          <p className="font-black text-gray-900 mb-4">Quick links</p>
          <div className="grid gap-2">
            {[
              ["/admin/messages", "Customer & driver inbox"],
              ["/portal", "Three-entrance portal"],
              ["/admin/billing", "Billing & payouts"],
              ["/admin/settings", "Platform settings"],
              ["/admin/drivers", "Driver approvals"],
              ["/admin/map", "Dispatch map"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="text-teal font-semibold text-sm hover:underline">
                {label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
