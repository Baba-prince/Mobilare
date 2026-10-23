import { NextRequest, NextResponse } from "next/server";
import {
  createUserByOwner,
  getSessionUser,
  listUsers,
  publicUser,
  type AuthRole,
} from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSessionUser();
  if (!me || me.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me || me.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const role = String(body.role || "admin") as Exclude<AuthRole, "owner">;
    const user = await createUserByOwner({
      ownerId: me.id,
      name: String(body.name || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
      role,
    });
    return NextResponse.json({ user: publicUser(user) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 400 },
    );
  }
}
