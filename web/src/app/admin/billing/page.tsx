import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin billing" };

export default function AdminBillingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Billing</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Gross (MTD)", "—"],
          ["Stripe fees (est.)", "—"],
          ["Driver payouts due", "—"],
        ].map(([l, v]) => (
          <div key={l} className="admin-card">
            <p className="text-sm text-gray-500">{l}</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{v}</p>
          </div>
        ))}
      </div>

      <div className="admin-card space-y-4">
        <p className="font-black text-gray-900">Payment processor</p>
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <div>
            <p className="text-gray-500">Stripe</p>
            <p className="font-semibold text-gray-900">Checkout connected</p>
          </div>
          <div>
            <p className="text-gray-500">Currency</p>
            <p className="font-semibold text-gray-900">GBP (VAT incl.)</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 font-light">
          Totals populate after paid bookings are recorded from Stripe Checkout.
        </p>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary inline-flex"
        >
          Open Stripe dashboard
        </a>
      </div>

      <div className="admin-card space-y-3">
        <p className="font-black text-gray-900">Payout schedule</p>
        <p className="text-sm text-gray-600 font-light">
          Drivers are paid weekly for completed jobs with verified proof of delivery.
        </p>
      </div>
    </div>
  );
}
