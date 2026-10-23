import { NextRequest, NextResponse } from "next/server";
import {
  deleteMessage,
  listMessages,
  sendMessage,
  type PortalFace,
} from "@/lib/server-messenger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function faceOf(req: NextRequest): PortalFace {
  const f = (req.headers.get("x-mobilare-face") || "customer").toLowerCase();
  if (f === "driver" || f === "crm" || f === "customer") return f;
  return "customer";
}

function actorOf(req: NextRequest) {
  return (req.headers.get("x-mobilare-actor") || "").trim();
}

export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.searchParams.get("threadId") || "";
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }
  const messages = await listMessages(threadId);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const actor = actorOf(req);
  if (!actor) {
    return NextResponse.json({ error: "Missing actor" }, { status: 400 });
  }
  const face = faceOf(req);
  const body = await req.json();
  const threadId = String(body.threadId || "");
  const text = String(body.body || "");
  if (!threadId || !text.trim()) {
    return NextResponse.json({ error: "threadId and body required" }, { status: 400 });
  }
  try {
    const msg = await sendMessage({
      threadId,
      face,
      actorId: actor,
      body: text,
      senderName: body.senderName ? String(body.senderName) : undefined,
    });
    return NextResponse.json({ message: msg });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const actor = actorOf(req);
  if (!actor) {
    return NextResponse.json({ error: "Missing actor" }, { status: 400 });
  }
  const face = faceOf(req);
  const messageId =
    req.nextUrl.searchParams.get("messageId") ||
    String((await req.json().catch(() => ({}))).messageId || "");
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }
  try {
    const result = await deleteMessage({ messageId, face, actorId: actor });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}
