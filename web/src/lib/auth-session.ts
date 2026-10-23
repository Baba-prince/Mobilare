export type UserRole = "customer" | "driver" | "admin";

export function portalForRole(_role: UserRole) {
  return "/portal";
}

export function homeForRole(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "driver") return "/driver";
  return "/account";
}
