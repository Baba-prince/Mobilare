/** Local demo session when Supabase env is unset (UI development). */
export type UserRole = "customer" | "driver" | "admin";

export type DemoUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

const KEY = "mobilare_demo_user";

export function saveDemoUser(user: DemoUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function loadDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function clearDemoUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function portalForRole(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "driver") return "/driver";
  return "/account";
}
