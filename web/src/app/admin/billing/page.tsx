import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin billing" };

export default function AdminBillingPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Billing</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Gross (MTD)", "£6,420"],
          ["Stripe fees (est.)", "£186"],
          ["Driver payouts due", "£2,110"],
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
            <p className="text-gray-500">Stripe mode</p>
            <p className="font-semibold text-gray-900">Test keys</p>
          </div>
          <div>
            <p className="text-gray-500">Webhook</p>
            <p className="font-semibold text-emerald-700">Connected</p>
          </div>
          <div>
            <p className="text-gray-500">Currency</p>
            <p className="font-semibold text-gray-900">GBP (VAT incl.)</p>
          </div>
        </div>
        <button type="button" className="btn-secondary">
          Open Stripe dashboard
        </button>
      </div>

      <div className="admin-card space-y-3">
        <p className="font-black text-gray-900">Payout schedule</p>
        <p className="text-sm text-gray-600 font-light">
          Drivers are paid weekly for completed jobs with verified proof of delivery.
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" defaultChecked className="accent-teal" />
          Auto-approve payouts under £500
        </label>
      </div>
    </div>
  );
}
