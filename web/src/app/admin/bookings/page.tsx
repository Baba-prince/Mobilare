import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin bookings" };

const rows = [
  {
    ref: "MB-21B9FFF1",
    service: "courier",
    route: "OL84AX → UB109LE",
    amount: "£42.00",
    status: "paid",
    job: "queued",
  },
  {
    ref: "MB-DEMO-010",
    service: "medical",
    route: "EC1A 1BB → N1 9GU",
    amount: "£55.00",
    status: "paid",
    job: "assigned",
  },
  {
    ref: "MB-DEMO-011",
    service: "legal",
    route: "WC2A 2LL → SE1 9SG",
    amount: "£38.00",
    status: "awaiting_payment",
    job: "—",
  },
];

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Bookings</h1>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-500 border-b border-gray-100">
            <tr>
              {["Ref", "Service", "Route", "Amount", "Payment", "Job"].map((h) => (
                <th key={h} className="py-3 pr-4 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ref} className="border-b border-gray-50 text-gray-800">
                <td className="py-3 pr-4 font-semibold">{r.ref}</td>
                <td className="py-3 pr-4">{r.service}</td>
                <td className="py-3 pr-4">{r.route}</td>
                <td className="py-3 pr-4">{r.amount}</td>
                <td className="py-3 pr-4">
                  <span className="text-teal font-semibold">{r.status}</span>
                </td>
                <td className="py-3 pr-4">{r.job}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
