import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";
import { site } from "@/lib/site";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Contact"
        subtitle="Bookings, partnerships, and support — we respond within business hours."
        primaryHref={site.phoneHref}
        primaryLabel="Call us"
        secondaryHref="/book"
        secondaryLabel="Book online"
        showPostcodeFinder
        postcodeCtaLabel="Start with postcode"
      />
      <Section>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4 text-gray-600 font-light">
            <p>
              Phone:{" "}
              <a className="text-teal font-semibold" href={site.phoneHref}>
                {site.phone}
              </a>
            </p>
            <p>
              Bookings:{" "}
              <a className="text-teal font-semibold" href={`mailto:${site.emailBookings}`}>
                {site.emailBookings}
              </a>
            </p>
            <p>
              Care:{" "}
              <a className="text-teal font-semibold" href={`mailto:${site.emailCare}`}>
                {site.emailCare}
              </a>
            </p>
          </div>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
