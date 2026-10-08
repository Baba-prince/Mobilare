import Link from "next/link";
import { site } from "@/lib/site";

export function PortalShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-gradient-to-r from-ink via-slate to-teal/10 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display font-black text-xl">
              {site.name}
            </Link>
            <span className="text-sm text-gray-300">{title}</span>
          </div>
          <Link href="/auth/sign-out" className="text-sm font-semibold text-gray-200 hover:text-white">
            Sign out
          </Link>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white hover:text-teal transition"
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
