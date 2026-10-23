import { redirect } from "next/navigation";

/** Bridge → live Tri-inbox. */
export default function AdminCrmInboxBridge() {
  redirect("/admin/messages");
}
