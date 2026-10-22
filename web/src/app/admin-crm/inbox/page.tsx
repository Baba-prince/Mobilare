import { redirect } from "next/navigation";

/** Bridge from Command Centre → live Tri-inbox (Supabase-backed). */
export default function AdminCrmInboxBridge() {
  redirect("/admin/messages");
}
