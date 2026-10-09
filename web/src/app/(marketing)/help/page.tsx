import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Help center" };

const faqs = [
  ["How do I get a quote?", "Enter pickup and drop-off on the booking form for an instant VAT-inclusive price."],
  ["When do I pay?", "Pay in full at Stripe Checkout when you confirm the booking."],
  ["How do I track?", "Use your booking reference on the track page, or open the success link after payment."],
  ["Can drivers sign up?", "Yes — choose Driver on the signup wizard and complete onboarding."],
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Help center"
        subtitle="Answers for customers and drivers. Still stuck? Contact us."
        primaryHref="/contact"
        primaryLabel="Contact support"
        showPostcodeFinder
        postcodeCtaLabel="Find address"
      />
      <Section>
        <div className="space-y-4">
          {faqs.map(([q, a]) => (
            <div key={q} className="card-soft">
              <p className="font-black text-gray-900">{q}</p>
              <p className="text-gray-600 font-light mt-2">{a}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Track a delivery: <Link href="/track" className="text-teal font-semibold">/track</Link>
        </p>
      </Section>
    </>
  );
}
