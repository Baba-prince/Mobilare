import { NextRequest, NextResponse } from "next/server";
import { createContactThread } from "@/lib/server-messenger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const phone = body.phone ? String(body.phone).trim() : undefined;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (message.length < 5) {
      return NextResponse.json({ error: "Message is too short" }, { status: 400 });
    }

    const thread = await createContactThread({ name, email, message, phone });

    return NextResponse.json({
      ok: true,
      thread_id: thread.id,
      message: "Message received — CRM will reply in the admin inbox.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not send message" },
      { status: 500 },
    );
  }
}
