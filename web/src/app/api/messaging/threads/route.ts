import { NextRequest, NextResponse } from "next/server";
import {
  deleteThread,
  listThreads,
  openThread,
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
  const actor = actorOf(req);
  if (!actor) {
    return NextResponse.json({ error: "Missing actor" }, { status: 400 });
  }
  const face = faceOf(req);
  const threads = await listThreads(face, actor);
  return NextResponse.json({ threads, mode: "portal" });
}

export async function POST(req: NextRequest) {
  const actor = actorOf(req);
  if (!actor) {
    return NextResponse.json({ error: "Missing actor" }, { status: 400 });
  }
  const face = faceOf(req);
  const body = await req.json().catch(() => ({}));
  const thread = await openThread({
    face,
    actorId: actor,
    subject: body.subject ? String(body.subject) : undefined,
    context: body.context ? String(body.context) : undefined,
    kind: body.kind,
  });
  return NextResponse.json({ thread });
}

export async function DELETE(req: NextRequest) {
  const actor = actorOf(req);
  if (!actor) {
    return NextResponse.json({ error: "Missing actor" }, { status: 400 });
  }
  const face = faceOf(req);
  const threadId =
    req.nextUrl.searchParams.get("threadId") ||
    String((await req.json().catch(() => ({}))).threadId || "");
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }
  try {
    const result = await deleteThread({ threadId, face, actorId: actor });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
}
