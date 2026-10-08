import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { OnboardingSteps } from "@/components/auth/OnboardingSteps";

export const metadata: Metadata = { title: "Driver onboarding" };

export default function DriverOnboardingPage() {
  return (
    <Section>
      <OnboardingSteps
        role="driver"
        finishHref="/driver"
        steps={[
          {
            title: "Driver profile",
            body: "Tell us your vehicle and working corridors so we can match the right jobs.",
          },
          {
            title: "Accepting work",
            body: "Open available jobs, accept what fits, and update status from pickup to delivery.",
          },
          {
            title: "Proof & payouts",
            body: "Capture photo proof at drop-off. Earnings show in your driver portal.",
          },
        ]}
      />
    </Section>
  );
}
