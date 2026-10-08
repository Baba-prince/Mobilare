import Link from "next/link";
import { site } from "@/lib/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-slate to-teal/10 text-white">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link href="/" className="font-display font-black text-2xl">
          {site.name}
        </Link>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
