import type { Metadata } from "next";
import { SignOutClient } from "@/components/auth/SignOutClient";

export const metadata: Metadata = { title: "Sign out" };

export default function SignOutPage() {
  return <SignOutClient />;
}
