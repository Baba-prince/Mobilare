import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

export type AuthRole = "owner" | "admin" | "driver" | "customer";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  passwordHash: string;
  createdAt: string;
  createdBy: string | null;
};

type AuthStore = {
  users: AuthUser[];
  ownerClaimedAt: string | null;
};

type SessionPayload = {
  uid: string;
  exp: number;
};

const COOKIE = "mobilare_session";
const SESSION_DAYS = 14;

const DATA_DIR =
  process.env.MOBILARE_DATA_DIR || path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "auth-users.json");
const SECRET_FILE = path.join(DATA_DIR, "auth-secret.txt");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function getSecret(): Promise<string> {
  if (process.env.AUTH_SECRET?.trim()) return process.env.AUTH_SECRET.trim();
  await ensureDir();
  try {
    const existing = (await fs.readFile(SECRET_FILE, "utf8")).trim();
    if (existing) return existing;
  } catch {
    /* create */
  }
  const secret = randomBytes(32).toString("hex");
  await fs.writeFile(SECRET_FILE, secret, "utf8");
  return secret;
}

async function readStore(): Promise<AuthStore> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as AuthStore;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      ownerClaimedAt: parsed.ownerClaimedAt || null,
    };
  } catch {
    return { users: [], ownerClaimedAt: null };
  }
}

async function writeStore(store: AuthStore) {
  await ensureDir();
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, STORE_FILE);
}

function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return `${s}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

async function signSession(payload: SessionPayload) {
  const secret = await getSecret();
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const secret = await getSecret();
  const expected = createHmac("sha256", secret).update(body).digest();
  const got = fromB64url(sig);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as SessionPayload;
    if (!payload.uid || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function publicUser(u: AuthUser) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
  };
}

export async function getAuthStatus() {
  const store = await readStore();
  return {
    ownerClaimed: Boolean(store.ownerClaimedAt) || store.users.some((u) => u.role === "owner"),
    userCount: store.users.length,
  };
}

export async function claimOwner(opts: {
  name: string;
  email: string;
  password: string;
}) {
  const store = await readStore();
  if (store.ownerClaimedAt || store.users.some((u) => u.role === "owner")) {
    throw new Error("Owner already claimed");
  }
  const email = opts.email.trim().toLowerCase();
  if (!email || !opts.password || opts.password.length < 8) {
    throw new Error("Valid email and password (min 8 chars) required");
  }
  if (store.users.some((u) => u.email === email)) {
    throw new Error("Email already in use");
  }
  const user: AuthUser = {
    id: createHash("sha256").update(`${email}:${Date.now()}`).digest("hex").slice(0, 24),
    email,
    name: opts.name.trim() || "Owner",
    role: "owner",
    passwordHash: hashPassword(opts.password),
    createdAt: new Date().toISOString(),
    createdBy: null,
  };
  store.users.push(user);
  store.ownerClaimedAt = user.createdAt;
  await writeStore(store);
  return user;
}

export async function login(emailRaw: string, password: string) {
  const store = await readStore();
  const email = emailRaw.trim().toLowerCase();
  const user = store.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  return user;
}

export async function createUserByOwner(opts: {
  ownerId: string;
  name: string;
  email: string;
  password: string;
  role: Exclude<AuthRole, "owner">;
}) {
  const store = await readStore();
  const owner = store.users.find((u) => u.id === opts.ownerId && u.role === "owner");
  if (!owner) throw new Error("Only the owner can create users");
  const email = opts.email.trim().toLowerCase();
  if (!email || opts.password.length < 8) {
    throw new Error("Valid email and password (min 8 chars) required");
  }
  if (!["admin", "driver", "customer"].includes(opts.role)) {
    throw new Error("Invalid role");
  }
  if (store.users.some((u) => u.email === email)) {
    throw new Error("Email already in use");
  }
  const user: AuthUser = {
    id: createHash("sha256").update(`${email}:${Date.now()}:${randomBytes(4).toString("hex")}`).digest("hex").slice(0, 24),
    email,
    name: opts.name.trim() || email,
    role: opts.role,
    passwordHash: hashPassword(opts.password),
    createdAt: new Date().toISOString(),
    createdBy: owner.id,
  };
  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function listUsers() {
  const store = await readStore();
  return store.users.map(publicUser);
}

export async function setSessionCookie(user: AuthUser) {
  const token = await signSession({
    uid: user.id,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  cookies().set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const store = await readStore();
  return store.users.find((u) => u.id === payload.uid) || null;
}

export function canAccessAdmin(user: AuthUser | null) {
  return Boolean(user && (user.role === "owner" || user.role === "admin"));
}

export function homeForAuthRole(role: AuthRole) {
  if (role === "owner" || role === "admin") return "/admin";
  if (role === "driver") return "/driver";
  return "/account";
}

export const SESSION_COOKIE = COOKIE;
