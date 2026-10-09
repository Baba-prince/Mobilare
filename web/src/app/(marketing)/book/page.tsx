import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Book" };

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

export default function BookPage({ searchParams }: Props) {
  const qs = new URLSearchParams();
  const postcode = one(searchParams?.postcode);
  const address = one(searchParams?.address);
  const line1 = one(searchParams?.line1);
  if (postcode) qs.set("postcode", postcode);
  if (address) qs.set("address", address);
  if (line1) qs.set("line1", line1);
  const embedSrc = qs.toString()
    ? `/embeds/booking-form.html?${qs.toString()}`
    : "/embeds/booking-form.html";

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
        showPostcodeFinder
        postcodeCtaLabel="Find pickup address"
      />
      <Section>
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white min-h-[720px]">
          <iframe
            src={embedSrc}
            title="Mobilare booking"
            className="w-full min-h-[720px] border-0"
          />
        </div>
      </Section>
    </>
  );
}
