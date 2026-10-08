import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Track" };

export default function TrackPage() {
  return (
    <>
      <PageHero
        eyebrow="Tracking"
        title="Track a delivery"
        subtitle="Enter your Mobilare booking reference to see live status."
        primaryHref="/book"
        primaryLabel="Book another"
      />
      <Section>
        <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 overflow-hidden">
          <iframe
            src="/embeds/track-widget.html"
            title="Track Mobilare"
            className="w-full h-[420px] border-0"
          />
        </div>
      </Section>
    </>
  );
}
