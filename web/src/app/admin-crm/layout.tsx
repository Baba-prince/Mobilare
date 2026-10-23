import type { Metadata } from "next";
import { RequireAdmin } from "@/components/admin/RequireAdmin";

export const metadata: Metadata = {
  title: "Mobilare Admin CRM",
  description: "Mobilare Admin CRM — ops only",
  robots: { index: false, follow: false },
};

export default function AdminCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <div className="min-h-screen bg-[#0A1931] text-white">{children}</div>
    </RequireAdmin>
  );
}
