"use client";

import { PostcodeFinder } from "@/components/marketing/PostcodeFinder";

/** Homepage hero postcode finder — live addresses API + book CTA. */
export function HomePostcodeForm() {
  return (
    <PostcodeFinder
      variant="hero"
      ctaLabel="Book now"
      placeholder="Enter your postcode"
      className="pt-4"
    />
  );
}
