import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin customers" };

const customers = [
  { name: "Acme Legal", email: "ops@acmelegal.example", bookings: 14 },
  { name: "North Clinic", email: "logistics@northclinic.example", bookings: 9 },
  { name: "Demo Customer", email: "demo@mobilare.co.uk", bookings: 1 },
];

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Customers</h1>
      <div className="space-y-3">
        {customers.map((c) => (
          <div key={c.email} className="admin-card flex justify-between gap-4">
            <div>
              <p className="font-black text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-500">{c.email}</p>
            </div>
            <p className="text-sm font-semibold text-teal">{c.bookings} bookings</p>
          </div>
        ))}
      </div>
    </div>
  );
}
