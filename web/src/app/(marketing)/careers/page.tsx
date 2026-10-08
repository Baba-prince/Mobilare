import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Careers" };

const roles = [
  { title: "Same-day courier driver", type: "Contractor", href: "/auth/sign-up?role=driver" },
  { title: "Dispatch coordinator", type: "Full-time", href: "/contact" },
  { title: "Customer success", type: "Full-time", href: "/contact" },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Careers"
        subtitle="Build the UK’s most reliable same-day network — on the road or in ops."
        primaryHref="/auth/sign-up?role=driver"
        primaryLabel="Apply as driver"
      />
      <Section>
        <div className="space-y-4">
          {roles.map((r) => (
            <Link key={r.title} href={r.href} className="card-soft flex justify-between items-center gap-4 hover:border-teal/40 transition">
              <div>
                <p className="font-black text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-500">{r.type}</p>
              </div>
              <span className="text-teal font-semibold text-sm">Apply →</span>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
