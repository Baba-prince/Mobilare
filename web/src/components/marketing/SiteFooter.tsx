import Link from "next/link";
import {
  footerCompany,
  footerProduct,
  footerSupport,
  site,
} from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-[#0D0D0D] text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <p className="font-display font-black text-2xl text-white">{site.name}</p>
          <p className="text-sm font-light leading-relaxed text-gray-400 max-w-xs">
            Urgent deliveries solved in hours, not days. Real drivers. Real deadlines.
          </p>
          <div className="space-y-1 text-sm">
            <a href={site.phoneHref} className="block hover:text-white">{site.phone}</a>
            <a href={`mailto:${site.emailBookings}`} className="block hover:text-white">
              {site.emailBookings}
            </a>
          </div>
        </div>

        <FooterCol title="Product" links={footerProduct} />
        <FooterCol title="Company" links={footerCompany} />
        <FooterCol title="Support" links={footerSupport} />
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row gap-3 justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Mobilare. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/auth/sign-up" className="hover:text-white">
              Customer / driver signup
            </Link>
            <Link href="/admin" className="hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">{title}</p>
      <ul className="space-y-2 text-sm font-light">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white transition">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
