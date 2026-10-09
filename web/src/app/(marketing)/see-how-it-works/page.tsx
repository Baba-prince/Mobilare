import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "See how it works" };

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="Walkthrough"
        title="See how it works"
        subtitle="A deeper look at the Mobilare booking journey from postcode to proof of delivery."
        showPostcodeFinder
        postcodeCtaLabel="Try postcode finder"
      />
      <Section>
        
        <ol className="space-y-6">
          {[
            ["Postcode check", "We validate UK coverage and distance bands before you commit."],
            ["Service selection", "Courier, medical, legal, warehouse, removals, or estate."],
            ["Address confirm", "Pick from suggestions after postcode — less retyping."],
            ["Stripe Checkout", "Secure pay-in-full; booking confirms when payment succeeds."],
            ["Ops + driver", "Job queues for dispatch; drivers update status and capture proof."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4 card-soft">
              <span className="font-black text-teal text-2xl w-8">{i + 1}</span>
              <div>
                <p className="font-black text-gray-900">{t}</p>
                <p className="text-gray-600 font-light mt-1">{d}</p>
              </div>
            </li>
          ))}
        </ol>
    
      </Section>
    </>
  );
}
