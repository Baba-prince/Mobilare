"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { portalForRole, saveDemoUser, UserRole } from "@/lib/auth-demo";
import { createClient } from "@/lib/supabase/client";

type Step = "role" | "details" | "done";

export function SignUpWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const initialRole = (params.get("role") as UserRole | null) || null;
  const [step, setStep] = useState<Step>(initialRole ? "details" : "role");
  const [role, setRole] = useState<UserRole | null>(
    initialRole === "driver" || initialRole === "customer" ? initialRole : null,
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (step === "role") return "Create your Mobilare account";
    if (step === "details") return role === "driver" ? "Driver signup" : "Customer signup";
    return "You are in";
  }, [step, role]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    if (supabase) {
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone,
            company,
            vehicle,
          },
        },
      });
      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          phone,
          company,
          vehicle,
        });
      }
    } else {
      saveDemoUser({
        id: crypto.randomUUID(),
        email,
        fullName,
        role,
      });
    }

    setLoading(false);
    setStep("done");
    setTimeout(() => {
      router.push(role === "driver" ? "/onboarding/driver" : "/onboarding/customer");
    }, 600);
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur p-6 md:p-8 space-y-6">
      <div>
        <p className="eyebrow text-teal-bright mb-2">Onboarding</p>
        <h1 className="font-display text-3xl font-black">{title}</h1>
        <p className="text-gray-300 font-light mt-2 text-sm">
          Step {step === "role" ? "1" : step === "details" ? "2" : "3"} of 3 — customers and drivers
          use separate signup paths.
        </p>
      </div>

      {step === "role" && (
        <div className="grid gap-3">
          {(
            [
              ["customer", "I need deliveries", "Book, pay, and track jobs"],
              ["driver", "I want to drive", "Accept jobs and earn"],
            ] as const
          ).map(([value, label, blurb]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRole(value);
                setStep("details");
              }}
              className="text-left rounded-2xl border border-white/20 px-5 py-4 hover:border-teal hover:bg-teal/10 transition"
            >
              <p className="font-black">{label}</p>
              <p className="text-sm text-gray-300 font-light mt-1">{blurb}</p>
            </button>
          ))}
          <p className="text-sm text-gray-400 pt-2">
            Already registered?{" "}
            <Link href="/auth/sign-in" className="text-teal-bright font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {step === "details" && role && (
        <form onSubmit={onSubmit} className="space-y-3">
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-white"
            onClick={() => setStep("role")}
          >
            ← Change account type
          </button>
          <input
            className="input-field"
            placeholder="Full name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password (min 8 chars)"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {role === "customer" ? (
            <input
              className="input-field"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          ) : (
            <input
              className="input-field"
              placeholder="Vehicle type (van / car / bike)"
              required
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            />
          )}
          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating…" : "Continue"}
          </button>
        </form>
      )}

      {step === "done" && role && (
        <div className="space-y-3">
          <p className="text-gray-200 font-light">Account created. Taking you to onboarding…</p>
          <Link href={portalForRole(role)} className="btn-primary inline-flex">
            Go to portal
          </Link>
        </div>
      )}
    </div>
  );
}
