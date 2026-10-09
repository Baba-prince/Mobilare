import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Coverage" };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="UK network"
        title="Coverage"
        subtitle="Same-day corridors across England with denser fleets in legal, healthcare, and estate hubs."
        showPostcodeFinder
        postcodeCtaLabel="Check coverage"
      />
      <Section>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            ["Core metros", "London, Manchester, Birmingham, Leeds, Bristol, and connecting belts."],
            ["Postcode + Maps", "Live postcode finder uses Google Maps Places + postcodes.io in production."],
            ["Specialist lanes", "Medical and legal routes with verified handoff."],
            ["Expanding weekly", "Driver density grows as demand corridors light up."],
          ].map(([t, d]) => (
            <div key={t} className="card-soft">
              <p className="font-black text-gray-900">{t}</p>
              <p className="text-gray-600 font-light mt-2">{d}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
