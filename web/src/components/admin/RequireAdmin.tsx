import { redirect } from "next/navigation";
import { canAccessAdmin, getSessionUser } from "@/lib/server-auth";

export async function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in?next=/admin");
  if (!canAccessAdmin(user)) redirect("/portal");
  return <>{children}</>;
}
