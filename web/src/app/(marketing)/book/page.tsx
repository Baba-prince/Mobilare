import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Book" };

export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Booking"
        title="Book a same-day delivery"
        subtitle="Instant quote, pay in full, track with proof. Sign in as a customer to save details."
        primaryHref="/auth/sign-up?role=customer"
        primaryLabel="Create customer account"
        secondaryHref="/track"
        secondaryLabel="Track a job"
      />
      <Section>
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white min-h-[720px]">
          <iframe
            src="/embeds/booking-form.html"
            title="Mobilare booking"
            className="w-full min-h-[720px] border-0"
          />
        </div>
      </Section>
    </>
  );
}
