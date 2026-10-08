import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin drivers" };

const drivers = [
  { name: "Jordan P", vehicle: "Van", status: "online", rating: "4.9" },
  { name: "Samira K", vehicle: "Car", status: "offline", rating: "4.8" },
  { name: "Pending approval", vehicle: "Bike", status: "review", rating: "—" },
];

export default function AdminDriversPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end gap-4">
        <h1 className="font-display text-3xl font-black text-gray-900">Drivers</h1>
        <button type="button" className="btn-secondary">
          Invite driver
        </button>
      </div>
      <div className="space-y-3">
        {drivers.map((d) => (
          <div key={d.name} className="admin-card flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-black text-gray-900">{d.name}</p>
              <p className="text-sm text-gray-500">
                {d.vehicle} · rating {d.rating}
              </p>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                d.status === "online"
                  ? "bg-emerald-50 text-emerald-700"
                  : d.status === "review"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {d.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
