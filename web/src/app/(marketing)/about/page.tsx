import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "About Mobilare" };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="About Mobilare"
        subtitle="We build deadline protection for teams who cannot wait until tomorrow."
      />
      <Section>
        
        <div className="prose prose-lg max-w-none text-gray-600 font-light space-y-4">
          <p>
            Mobilare is UK same-day logistics infrastructure — courier through enterprise removals —
            with real-time tracking and proof on every paid job.
          </p>
          <p>
            Our platform connects customers who need certainty with drivers who deliver it, and an
            ops dashboard that keeps billing, settings, and fleet control in one place.
          </p>
        </div>
    
      </Section>
    </>
  );
}
