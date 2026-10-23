import { redirect } from "next/navigation";
import { getSessionUser, type AuthRole } from "@/lib/server-auth";

export async function RequireRole({
  roles,
  children,
  nextPath,
}: {
  roles: AuthRole[];
  children: React.ReactNode;
  nextPath: string;
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  if (!roles.includes(user.role)) redirect("/portal");
  return <>{children}</>;
}
