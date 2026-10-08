"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearDemoUser } from "@/lib/auth-demo";
import { createClient } from "@/lib/supabase/client";

export function SignOutClient() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function run() {
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
      clearDemoUser();
      setDone(true);
    }
    run();
  }, []);

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-4">
      <h1 className="font-display text-3xl font-black">
        {done ? "Signed out" : "Signing out…"}
      </h1>
      <p className="text-gray-300 font-light text-sm">
        Your session has been cleared on this device.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/auth/sign-in" className="btn-secondary border-white/30 text-white hover:bg-white/5">
          Sign in again
        </Link>
      </div>
    </div>
  );
}
