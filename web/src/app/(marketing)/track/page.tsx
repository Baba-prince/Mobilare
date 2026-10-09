import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";
import { LiveTrackPanel } from "@/components/tracking/LiveTrackPanel";

export const metadata: Metadata = { title: "Track" };

export default function TrackPage() {
  return (
    <>
      <PageHero
        eyebrow="Tracking"
        title="Track a delivery"
        subtitle="Enter your Mobilare booking reference for live status and Google Maps route."
        primaryHref="/book"
        primaryLabel="Book another"
      />
      <Section>
        <Suspense fallback={<p className="text-gray-500">Loading tracker…</p>}>
          <LiveTrackPanel />
        </Suspense>
      </Section>
    </>
  );
}
