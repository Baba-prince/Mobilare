import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-slate to-teal/10 text-white">
      <div className="max-w-lg mx-auto px-4 py-10">
        <BrandLogo href="/" size="md" priority className="text-white" />
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
