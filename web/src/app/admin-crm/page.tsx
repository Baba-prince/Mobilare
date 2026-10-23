import Link from "next/link";

/** Admin CRM entry — live ops board + inbox. */
export default function AdminCrmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-8 space-y-5">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#00C896]">CRM</p>
        <h1 className="font-display text-3xl font-black">Admin CRM</h1>
        <p className="text-sm text-white/70 font-light">
          Live operations dashboard and Tri-inbox for customer support and driver desk messages.
        </p>
        <div className="grid gap-2">
          <Link
            href="/admin"
            className="rounded-full bg-[#00C896] text-[#0A1931] font-bold text-center py-3"
          >
            Operations dashboard
          </Link>
          <Link
            href="/admin/messages"
            className="rounded-full border border-white/20 text-white font-semibold text-center py-3 hover:bg-white/10"
          >
            Live CRM inbox
          </Link>
          <Link href="/portal" className="text-center text-sm text-white/50 hover:text-white">
            ← Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
