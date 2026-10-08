import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpWizard } from "@/components/auth/SignUpWizard";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpWizard />
    </Suspense>
  );
}
