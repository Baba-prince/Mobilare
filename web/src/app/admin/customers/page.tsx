import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin customers" };

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-3xl font-black text-gray-900">Customers</h1>
      <div className="admin-card">
        <p className="text-sm text-gray-600 font-light">
          Customer accounts appear here once they book or create an account. No records yet.
        </p>
      </div>
    </div>
  );
}
