import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { MessengerFace } from "@/lib/messenger";

export type PortalFace = MessengerFace;

export type StoreThread = {
  id: string;
  subject: string;
  context: string;
  kind: "support" | "driver_ops" | "contact" | "job";
  status: string;
  customerActorId: string | null;
  driverActorId: string | null;
  contactEmail: string | null;
  contactName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
};

export type StoreMessage = {
  id: string;
  threadId: string;
  from: PortalFace | "system";
  body: string;
  at: string;
  senderName?: string | null;
};

type Store = {
  threads: StoreThread[];
  messages: StoreMessage[];
};

const DATA_DIR =
  process.env.MOBILARE_DATA_DIR ||
  path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "messenger.json");

function emptyStore(): Store {
  return { threads: [], messages: [] };
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Store;
    if (!parsed.threads || !parsed.messages) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

function now() {
  return new Date().toISOString();
}

export async function listThreads(face: PortalFace, actorId: string) {
  const store = await readStore();
  let threads = store.threads;
  if (face === "customer") {
    threads = threads.filter(
      (t) =>
        t.customerActorId === actorId ||
        t.kind === "contact" && t.customerActorId === actorId,
    );
  } else if (face === "driver") {
    threads = threads.filter((t) => t.driverActorId === actorId);
  }
  // crm sees all
  return threads
    .slice()
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    .map((t) => ({
      id: t.id,
      subject: t.subject,
      context: t.context || t.lastMessagePreview,
      kind: t.kind,
      status: t.status,
      customerProfileId: t.customerActorId,
      driverProfileId: t.driverActorId,
      bookingId: null as string | null,
      lastMessageAt: t.lastMessageAt,
      lastMessagePreview: t.lastMessagePreview,
      unread: 0,
      updatedAt: t.lastMessageAt,
      contactEmail: t.contactEmail,
      contactName: t.contactName,
    }));
}

export async function listMessages(threadId: string) {
  const store = await readStore();
  return store.messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((m) => ({
      id: m.id,
      conversationId: m.threadId,
      from: m.from,
      body: m.body,
      at: m.at,
      senderProfileId: null as string | null,
      senderName: m.senderName || null,
    }));
}

export async function openThread(opts: {
  face: PortalFace;
  actorId: string;
  kind?: StoreThread["kind"];
  subject?: string;
  context?: string;
}) {
  const store = await readStore();
  const kind =
    opts.kind ||
    (opts.face === "driver" ? "driver_ops" : opts.face === "crm" ? "support" : "support");

  let existing = store.threads.find((t) => {
    if (t.status === "closed") return false;
    if (kind === "driver_ops") return t.kind === "driver_ops" && t.driverActorId === opts.actorId;
    if (kind === "support") return t.kind === "support" && t.customerActorId === opts.actorId;
    return false;
  });

  if (!existing && opts.face === "crm") {
    existing = store.threads[0];
  }

  if (existing) return existing;

  const at = now();
  const thread: StoreThread = {
    id: randomUUID(),
    subject:
      opts.subject ||
      (kind === "driver_ops" ? "Driver desk" : kind === "contact" ? "Website contact" : "Support"),
    context: opts.context || "New conversation with Mobilare CRM",
    kind,
    status: "open",
    customerActorId: opts.face === "customer" || kind === "support" || kind === "contact" ? opts.actorId : null,
    driverActorId: opts.face === "driver" || kind === "driver_ops" ? opts.actorId : null,
    contactEmail: null,
    contactName: null,
    lastMessageAt: at,
    lastMessagePreview: "Thread opened",
    createdAt: at,
  };

  store.threads.unshift(thread);
  store.messages.push({
    id: randomUUID(),
    threadId: thread.id,
    from: "system",
    body:
      kind === "driver_ops"
        ? "Driver ops thread open — CRM / dispatch will reply here."
        : "Support thread open — Mobilare CRM will reply here.",
    at,
  });
  await writeStore(store);
  return thread;
}

export async function sendMessage(opts: {
  threadId: string;
  face: PortalFace;
  actorId: string;
  body: string;
  senderName?: string;
}) {
  const text = opts.body.trim();
  if (!text) throw new Error("Empty message");
  const store = await readStore();
  const thread = store.threads.find((t) => t.id === opts.threadId);
  if (!thread) throw new Error("Thread not found");

  // Access check
  if (opts.face === "customer" && thread.customerActorId && thread.customerActorId !== opts.actorId) {
    throw new Error("Forbidden");
  }
  if (opts.face === "driver" && thread.driverActorId && thread.driverActorId !== opts.actorId) {
    throw new Error("Forbidden");
  }

  const at = now();
  const msg: StoreMessage = {
    id: randomUUID(),
    threadId: thread.id,
    from: opts.face,
    body: text,
    at,
    senderName: opts.senderName || null,
  };
  store.messages.push(msg);
  thread.lastMessageAt = at;
  thread.lastMessagePreview = text.slice(0, 160);
  thread.context = thread.lastMessagePreview;
  await writeStore(store);
  return msg;
}

export async function createAiLeadThread(opts: {
  name: string;
  email: string;
  phone?: string;
  summary: string;
  details: Record<string, string>;
  transcript: { role: string; content: string }[];
}) {
  const store = await readStore();
  const at = now();
  const actorId = `ai:${opts.email.trim().toLowerCase()}`;
  const detailLines = Object.entries(opts.details)
    .filter(([, v]) => v)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join("\n");
  const thread: StoreThread = {
    id: randomUUID(),
    subject: `AI lead · ${opts.name.trim() || opts.email}`,
    context: opts.summary.slice(0, 160),
    kind: "contact",
    status: "open",
    customerActorId: actorId,
    driverActorId: null,
    contactEmail: opts.email.trim().toLowerCase(),
    contactName: opts.name.trim(),
    lastMessageAt: at,
    lastMessagePreview: opts.summary.slice(0, 160),
    createdAt: at,
  };
  store.threads.unshift(thread);
  store.messages.push({
    id: randomUUID(),
    threadId: thread.id,
    from: "system",
    body: `AI assistant lead from ${opts.name} <${opts.email}>${opts.phone ? ` · ${opts.phone}` : ""}`,
    at,
  });
  store.messages.push({
    id: randomUUID(),
    threadId: thread.id,
    from: "customer",
    body: `Requirement brief\n\n${opts.summary}\n\n${detailLines}`,
    at: new Date(Date.now() + 1).toISOString(),
    senderName: opts.name.trim(),
  });
  if (opts.transcript.length) {
    const transcriptText = opts.transcript
      .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n");
    store.messages.push({
      id: randomUUID(),
      threadId: thread.id,
      from: "system",
      body: `Chat transcript\n\n${transcriptText.slice(0, 6000)}`,
      at: new Date(Date.now() + 2).toISOString(),
    });
  }
  await writeStore(store);
  return thread;
}

export async function createContactThread(opts: {
  name: string;
  email: string;
  message: string;
  phone?: string;
}) {
  const store = await readStore();
  const at = now();
  const actorId = `contact:${opts.email.trim().toLowerCase()}`;
  const thread: StoreThread = {
    id: randomUUID(),
    subject: `Contact · ${opts.name.trim() || opts.email}`,
    context: opts.message.trim().slice(0, 160),
    kind: "contact",
    status: "open",
    customerActorId: actorId,
    driverActorId: null,
    contactEmail: opts.email.trim().toLowerCase(),
    contactName: opts.name.trim(),
    lastMessageAt: at,
    lastMessagePreview: opts.message.trim().slice(0, 160),
    createdAt: at,
  };
  store.threads.unshift(thread);
  store.messages.push({
    id: randomUUID(),
    threadId: thread.id,
    from: "system",
    body: `Website contact from ${opts.name} <${opts.email}>${opts.phone ? ` · ${opts.phone}` : ""}`,
    at,
  });
  store.messages.push({
    id: randomUUID(),
    threadId: thread.id,
    from: "customer",
    body: opts.message.trim(),
    at: new Date(Date.now() + 1).toISOString(),
    senderName: opts.name.trim(),
  });
  await writeStore(store);
  return thread;
}
