import Link from "next/link";
import { site } from "@/lib/site";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <div className="min-h-screen grid lg:grid-cols-[260px_1fr]">
        <aside className="bg-ink text-white px-5 py-6 flex flex-col">
          <Link href="/" className="font-display font-black text-2xl mb-1">
            {site.name}
          </Link>
          <p className="text-xs text-gray-400 mb-8 uppercase tracking-wider">Admin</p>
          <nav className="space-y-1 flex-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/auth/sign-out" className="text-sm text-gray-400 hover:text-white mt-6">
            Sign out
          </Link>
        </aside>
        <div className="px-4 sm:px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
