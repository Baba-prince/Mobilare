import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "How it works" };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Product"
        title="How it works"
        subtitle="Quote in seconds, pay in full, track to the door with verified proof."
        showPostcodeFinder
        postcodeCtaLabel="Try a postcode"
      />
      <Section>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["1. Quote", "Enter pickup and drop-off. Instant VAT-inclusive pricing for all six services."],
            ["2. Book & pay", "Confirm details and pay in full via Stripe Checkout — no half-paid jobs."],
            ["3. Track & proof", "Live status, ETA, and photo proof when the delivery completes."],
          ].map(([t, d]) => (
            <div key={t} className="card-soft">
              <p className="font-black text-xl text-gray-900 mb-2">{t}</p>
              <p className="text-gray-600 font-light leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
    
      </Section>
    </>
  );
}
