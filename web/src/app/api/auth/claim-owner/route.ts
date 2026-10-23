import { NextRequest, NextResponse } from "next/server";
import { claimOwner, publicUser, setSessionCookie } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await claimOwner({
      name: String(body.name || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
    });
    await setSessionCookie(user);
    return NextResponse.json({ user: publicUser(user) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Claim failed" },
      { status: 400 },
    );
  }
}
