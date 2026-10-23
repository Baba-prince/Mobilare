import { NextRequest, NextResponse } from "next/server";
import { homeForAuthRole, login, publicUser, setSessionCookie } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await login(String(body.email || ""), String(body.password || ""));
    await setSessionCookie(user);
    return NextResponse.json({
      user: publicUser(user),
      redirect: homeForAuthRole(user.role),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 401 },
    );
  }
}
