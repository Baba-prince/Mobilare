import { PortalShell } from "@/components/portal/PortalShell";

const nav = [
  { href: "/driver", label: "Dashboard" },
  { href: "/driver/jobs", label: "Jobs" },
  { href: "/driver/location", label: "Live map" },
  { href: "/driver/messages", label: "Messages" },
  { href: "/driver/earnings", label: "Earnings" },
  { href: "/driver/settings", label: "Settings" },
  { href: "/portal", label: "Portal" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="Driver portal" nav={nav}>{children}</PortalShell>;
}
