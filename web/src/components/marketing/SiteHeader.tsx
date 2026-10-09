"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { marketingNav } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-ink via-slate to-teal/10 border-b border-teal/20 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
        <BrandLogo href="/" size="md" priority className="text-white" />

        <div className="hidden lg:flex items-center gap-6">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-300 hover:text-white transition font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/auth/sign-in" className="text-sm text-gray-300 hover:text-white font-medium">
            Sign in
          </Link>
          <Link href="/book" className="px-6 py-2 bg-teal text-white font-semibold rounded-full hover:bg-teal-bright transition">
            Book now
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden text-white text-sm font-semibold px-3 py-2 border border-white/20 rounded-full"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 px-4 pb-4 space-y-2 bg-ink/95">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-2 text-gray-200"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/auth/sign-in" className="block py-2 text-gray-200" onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link href="/book" className="btn-primary w-full" onClick={() => setOpen(false)}>
            Book now
          </Link>
        </div>
      )}
    </nav>
  );
}
