import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Pricing" };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Transparent rates"
        title="Pricing"
        subtitle="VAT-inclusive GBP. Competitive same-day bands. Pay in full at booking."
      />
      <Section>
        
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            ["Local", "From £18", "Short hops inside the same corridor"],
            ["Regional", "From £35", "Cross-city same-day with live tracking"],
            ["Priority", "Custom", "Medical, legal, and deadline-critical SLAs"],
          ].map(([t, p, d]) => (
            <div key={t} className="card-soft border-teal/20">
              <p className="eyebrow mb-3">{t}</p>
              <p className="font-display text-3xl font-black text-gray-900">{p}</p>
              <p className="text-gray-600 font-light mt-3">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 font-light">
          Final quote is calculated live from distance and service type. No hidden booking fees.
        </p>
    
      </Section>
    </>
  );
}
