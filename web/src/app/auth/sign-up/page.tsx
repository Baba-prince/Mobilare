import type { Metadata } from "next";
import Link from "next/link";
import { getAuthStatus } from "@/lib/server-auth";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const status = await getAuthStatus();

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-5">
      <p className="eyebrow text-teal-bright">Access</p>
      <h1 className="font-display text-3xl font-black">Accounts are invite-only</h1>
      <p className="text-gray-300 font-light text-sm">
        Public self-signup is closed. The owner creates login credentials from the CRM admin menu.
      </p>
      <div className="flex flex-wrap gap-3">
        {!status.ownerClaimed ? (
          <Link href="/auth/claim-owner" className="btn-primary">
            Claim owner (one-time)
          </Link>
        ) : null}
        <Link href="/auth/sign-in" className="btn-secondary border-white/30 text-white hover:bg-white/5">
          Sign in
        </Link>
        <Link href="/contact" className="text-sm text-teal-bright self-center">
          Contact support →
        </Link>
      </div>
    </div>
  );
}
