import { PortalShell } from "@/components/portal/PortalShell";

const nav = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/settings", label: "Settings" },
  { href: "/book", label: "New booking" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalShell title="Customer portal" nav={nav}>{children}</PortalShell>;
}
