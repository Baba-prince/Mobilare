import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Drive with Mobilare" };

export default function DrivePage() {
  return (
    <>
      <PageHero
        eyebrow="Drivers"
        title="Drive with Mobilare"
        subtitle="Take same-day jobs, update status in real time, and earn on verified deliveries."
        primaryHref="/auth/sign-up?role=driver"
        primaryLabel="Driver signup"
        secondaryHref="/auth/sign-in"
        secondaryLabel="Driver sign in"
      />
      <Section>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Flexible jobs", "Accept work that fits your corridor and vehicle."],
            ["Clear payouts", "See job values before you accept."],
            ["Simple proof", "Photo and timestamp capture at drop-off."],
          ].map(([t, d]) => (
            <div key={t} className="card-soft">
              <p className="font-black text-gray-900">{t}</p>
              <p className="text-gray-600 font-light mt-2">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/onboarding/driver" className="btn-primary">
            Start driver onboarding
          </Link>
        </div>
      </Section>
    </>
  );
}
