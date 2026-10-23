export type UserRole = "customer" | "driver" | "admin" | "owner";

export function portalForRole(_role: UserRole) {
  return "/portal";
}

export function homeForRole(role: UserRole) {
  if (role === "admin" || role === "owner") return "/admin";
  if (role === "driver") return "/driver";
  return "/account";
}
