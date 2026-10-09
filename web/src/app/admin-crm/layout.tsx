import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobilare Admin CRM",
  description: "Mobilare Command Centre 2027 — admin only",
  robots: { index: false, follow: false },
};

export default function AdminCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A1931] text-white">
      {children}
    </div>
  );
}
