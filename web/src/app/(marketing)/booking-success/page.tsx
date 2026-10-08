import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";
import { BookingStatusPoll } from "@/components/booking/BookingStatusPoll";

export const metadata: Metadata = { title: "Booking confirmed" };

export default function BookingSuccessPage() {
  return (
    <>
      <PageHero
        eyebrow="Payment"
        title="Thanks — confirming your booking"
        subtitle="Stripe usually finishes instantly. Keep this page open for your reference."
        primaryHref="/track"
        primaryLabel="Track delivery"
      />
      <Section narrow>
        <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
          <BookingStatusPoll />
        </Suspense>
      </Section>
    </>
  );
}
