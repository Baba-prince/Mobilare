"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { UserRole } from "@/lib/auth-session";
import { createClient } from "@/lib/supabase/client";

type Access = {
  email: string;
  name: string;
  role: UserRole;
};

const doors: {
  role: UserRole;
  href: string;
  title: string;
  blurb: string;
  badge: string;
}[] = [
  {
    role: "customer",
    href: "/account",
    title: "Customer portal",
    blurb: "Bookings, tracking, and live support chat with CRM.",
    badge: "Users",
  },
  {
    role: "driver",
    href: "/driver",
    title: "Driver portal",
    blurb: "Jobs, earnings, and dispatch messaging with CRM.",
    badge: "Drivers",
  },
  {
    role: "admin",
    href: "/admin",
    title: "CRM Admin",
    blurb: "Ops board, inbox for customers & drivers, dispatch map.",
    badge: "CRM",
  },
];

export default function PortalPage() {
  const [access, setAccess] = useState<Access | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (user && alive) {
          const role = ((user.user_metadata?.role as UserRole) || "customer") as UserRole;
          setAccess({
            email: user.email || "",
            name: String(user.user_metadata?.full_name || user.email || "Member"),
            role,
          });
          setBusy(false);
          return;
        }
      }
      if (alive) {
        setAccess(null);
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink via-slate to-[#0a1628] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
          <BrandLogo href="/" size="md" className="text-white" />
          <div className="flex items-center gap-3 text-sm">
            {access ? (
              <span className="text-white/60">{access.email}</span>
            ) : (
              <Link href="/auth/sign-in" className="btn-primary !py-2 !px-4 text-sm">
                Sign in
              </Link>
            )}
            <Link href="/auth/sign-out" className="text-white/70 hover:text-white">
              Sign out
            </Link>
          </div>
        </div>

        <p className="eyebrow text-teal-bright mb-3">Portal · three entrances</p>
        <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight max-w-2xl">
          Open the system.
        </h1>
        <p className="mt-4 text-white/70 font-light max-w-xl text-lg">
          Customers, drivers, and CRM share one login. Messages between users, drivers, and
          admin land in the same live inbox.
        </p>

        {busy ? (
          <p className="mt-10 text-white/50">Loading access…</p>
        ) : (
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {doors.map((door) => {
              const unlocked = !access || access.role === door.role || access.role === "admin";
              const primary = access?.role === door.role;
              return (
                <div
                  key={door.role}
                  className={`rounded-3xl border p-6 flex flex-col ${
                    primary
                      ? "border-teal-bright/50 bg-teal/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-teal-bright">
                    {door.badge}
                  </span>
                  <h2 className="font-display text-2xl font-black mt-3">{door.title}</h2>
                  <p className="text-sm text-white/65 font-light mt-2 flex-1">{door.blurb}</p>
                  {unlocked ? (
                    <Link
                      href={door.href}
                      className={`mt-6 inline-flex justify-center rounded-full px-5 py-3 text-sm font-bold transition ${
                        primary
                          ? "bg-teal-bright text-ink hover:bg-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      Enter →
                    </Link>
                  ) : (
                    <p className="mt-6 text-xs text-white/40">
                      Signed in as {access?.role}. Use the matching entrance or an admin account.
                    </p>
                  )}
                  {door.role === "admin" && unlocked ? (
                    <Link
                      href="/admin-crm"
                      className="mt-2 text-center text-xs text-teal-bright hover:underline"
                    >
                      Open CRM dashboard
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/account/messages" className="text-teal-bright hover:underline">
            Customer support chat
          </Link>
          <Link href="/account/bookings" className="text-teal-bright hover:underline">
            Track map
          </Link>
          <Link href="/driver/messages" className="text-teal-bright hover:underline">
            Driver ↔ CRM
          </Link>
          <Link href="/driver/location" className="text-teal-bright hover:underline">
            Driver live GPS
          </Link>
          <Link href="/admin/messages" className="text-teal-bright hover:underline">
            CRM inbox
          </Link>
          <Link href="/admin/map" className="text-teal-bright hover:underline">
            Dispatch map
          </Link>
        </div>
      </div>
    </div>
  );
}
