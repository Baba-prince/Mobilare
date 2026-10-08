import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Checkout cancelled" };

export default function BookingCancelPage() {
  return (
    <>
      <PageHero
        eyebrow="Checkout"
        title="Checkout cancelled"
        subtitle="No payment was taken. You can restart booking whenever you are ready."
        primaryHref="/book"
        primaryLabel="Return to booking"
      />
      <Section narrow>
        <p className="text-gray-600 font-light">
          Need help? <Link href="/contact" className="text-teal font-semibold">Contact support</Link>.
        </p>
      </Section>
    </>
  );
}
