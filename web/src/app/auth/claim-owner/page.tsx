import type { Metadata } from "next";
import { ClaimOwnerForm } from "@/components/auth/ClaimOwnerForm";

export const metadata: Metadata = {
  title: "Claim owner",
  robots: { index: false, follow: false },
};

export default function ClaimOwnerPage() {
  return <ClaimOwnerForm />;
}
