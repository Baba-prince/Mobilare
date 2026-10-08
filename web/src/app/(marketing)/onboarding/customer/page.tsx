import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { OnboardingSteps } from "@/components/auth/OnboardingSteps";

export const metadata: Metadata = { title: "Customer onboarding" };

export default function CustomerOnboardingPage() {
  return (
    <Section>
      <OnboardingSteps
        role="customer"
        finishHref="/account"
        steps={[
          {
            title: "Welcome aboard",
            body: "Your customer account lets you quote, book, pay, and track every Mobilare job.",
          },
          {
            title: "How payment works",
            body: "Bookings are paid in full via Stripe. VAT is included in the quote you see.",
          },
          {
            title: "Tracking & support",
            body: "Use your booking reference anytime. Help center and contact are always in the footer.",
          },
        ]}
      />
    </Section>
  );
}
