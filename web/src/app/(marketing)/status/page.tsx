import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Status" };

const systems = [
  ["Website", "Operational"],
  ["Quote API", "Operational"],
  ["Checkout / Stripe", "Operational"],
  ["Tracking", "Operational"],
  ["Driver app portal", "Beta"],
];

export default function StatusPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="System status"
        subtitle="Live health of Mobilare customer-facing systems."
        primaryHref="/help"
        primaryLabel="Help center"
      />
      <Section>
        <div className="space-y-3">
          {systems.map(([name, state]) => (
            <div key={name} className="card-soft flex justify-between items-center">
              <p className="font-semibold text-gray-900">{name}</p>
              <span
                className={`text-sm font-bold ${
                  state === "Operational" ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {state}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
