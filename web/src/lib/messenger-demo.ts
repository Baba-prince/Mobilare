import {
  DEMO_MESSENGER_KEY,
  type MessengerFace,
  type MessengerMessage,
  type MessengerThread,
} from "./messenger";

type State = {
  threads: MessengerThread[];
  messages: MessengerMessage[];
};

function now() {
  return new Date().toISOString();
}

function seed(): State {
  const at = now();
  const supportId = "demo_support_1";
  const driverId = "demo_driver_1";
  return {
    threads: [
      {
        id: supportId,
        subject: "Support",
        context: "Where is my delivery?",
        kind: "support",
        status: "open",
        customerProfileId: "demo_customer",
        driverProfileId: null,
        bookingId: null,
        lastMessageAt: at,
        lastMessagePreview: "Where is my delivery?",
        unread: 1,
        updatedAt: at,
      },
      {
        id: driverId,
        subject: "Driver desk",
        context: "Need corridor coverage for SE1",
        kind: "driver_ops",
        status: "open",
        customerProfileId: null,
        driverProfileId: "demo_driver",
        bookingId: null,
        lastMessageAt: at,
        lastMessagePreview: "Need corridor coverage for SE1",
        unread: 1,
        updatedAt: at,
      },
    ],
    messages: [
      {
        id: "dm1",
        conversationId: supportId,
        from: "customer",
        body: "Where is my delivery? Booking MB-DEMO01 looked stuck after pickup.",
        at: at,
        senderProfileId: null,
      },
      {
        id: "dm2",
        conversationId: supportId,
        from: "crm",
        body: "Checking with the assigned driver now — hang tight.",
        at: at,
        senderProfileId: null,
      },
      {
        id: "dm3",
        conversationId: driverId,
        from: "driver",
        body: "Need corridor coverage for SE1 this afternoon.",
        at: at,
        senderProfileId: null,
      },
      {
        id: "dm4",
        conversationId: driverId,
        from: "crm",
        body: "Copy — we will push two jobs into your queue.",
        at: at,
        senderProfileId: null,
      },
    ],
  };
}

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(DEMO_MESSENGER_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as State;
    if (!parsed.threads?.length) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

let state = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_MESSENGER_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribeDemoMessenger(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getDemoSnapshot() {
  return state;
}

export function threadsForFace(face: MessengerFace): MessengerThread[] {
  return state.threads
    .filter((t) => {
      if (face === "crm") return true;
      if (face === "customer") return t.kind === "support";
      if (face === "driver") return t.kind === "driver_ops" || t.kind === "job";
      return false;
    })
    .map((t) => ({
      ...t,
      unread: face === "crm" ? (t.kind === "support" || t.kind === "driver_ops" ? t.unread : 0) : t.unread,
    }))
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export function messagesForThread(id: string) {
  return state.messages
    .filter((m) => m.conversationId === id)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function ensureDemoThread(face: MessengerFace): MessengerThread {
  const kind = face === "driver" ? "driver_ops" : face === "customer" ? "support" : "support";
  let existing = state.threads.find((t) => t.kind === kind && t.status !== "closed");
  if (!existing && face === "crm") existing = state.threads[0];
  if (existing) return existing;

  const id = `demo_${kind}_${Math.random().toString(36).slice(2, 8)}`;
  const at = now();
  const thread: MessengerThread = {
    id,
    subject: face === "driver" ? "Driver desk" : "Support",
    context: "New thread",
    kind,
    status: "open",
    customerProfileId: face === "customer" ? "demo_customer" : null,
    driverProfileId: face === "driver" ? "demo_driver" : null,
    bookingId: null,
    lastMessageAt: at,
    lastMessagePreview: "Thread opened",
    unread: 0,
    updatedAt: at,
  };
  state = {
    threads: [thread, ...state.threads],
    messages: [
      ...state.messages,
      {
        id: `dm_${Math.random().toString(36).slice(2, 8)}`,
        conversationId: id,
        from: "system",
        body: "Thread opened. Messages sync locally until you sign in.",
        at,
        senderProfileId: null,
      },
    ],
  };
  emit();
  return thread;
}

export function sendDemoMessage(threadId: string, face: MessengerFace, body: string) {
  const text = body.trim();
  if (!text) return;
  const at = now();
  const msg: MessengerMessage = {
    id: `dm_${Math.random().toString(36).slice(2, 8)}`,
    conversationId: threadId,
    from: face,
    body: text,
    at,
    senderProfileId: null,
  };
  state = {
    threads: state.threads.map((t) =>
      t.id === threadId
        ? {
            ...t,
            lastMessageAt: at,
            lastMessagePreview: text.slice(0, 160),
            updatedAt: at,
            unread: face === "crm" ? 0 : t.unread + 1,
          }
        : t,
    ),
    messages: [...state.messages, msg],
  };
  emit();
}

export function markDemoRead(threadId: string, _face: MessengerFace) {
  state = {
    ...state,
    threads: state.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
  };
  emit();
}
