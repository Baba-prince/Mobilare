import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mobilare: Same-Day Courier & Logistics",
    template: "%s · Mobilare",
  },
  description:
    "Urgent deliveries solved in hours, not days. Real drivers. Real deadlines. Deadline protection for legal, healthcare, estate agents, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans bg-white text-charcoal">{children}</body>
    </html>
  );
}
