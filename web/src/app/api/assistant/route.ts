import { NextRequest, NextResponse } from "next/server";
import { createAiLeadThread } from "@/lib/server-messenger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Brief = {
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  pickup?: string;
  dropoff?: string;
  when?: string;
  notes?: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const STEPS: { key: keyof Brief; ask: string; validate?: (v: string) => string | null }[] = [
  {
    key: "name",
    ask: "Hi — I’m Mobilare’s booking assistant. What’s your name?",
  },
  {
    key: "email",
    ask: "Thanks. What’s the best email for quotes and updates?",
    validate: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Please enter a valid email."),
  },
  {
    key: "phone",
    ask: "Got it. Mobile number for the driver / ops team? (or type skip)",
  },
  {
    key: "service",
    ask: "What do you need — courier, medical, legal, warehouse, removals, or estate?",
  },
  {
    key: "pickup",
    ask: "Pickup postcode (e.g. OL8 1AA)?",
  },
  {
    key: "dropoff",
    ask: "Drop-off postcode?",
  },
  {
    key: "when",
    ask: "When do you need this — today, tomorrow, or a specific date/time?",
  },
  {
    key: "notes",
    ask: "Any special requirements (size, temperature, waiting time, stairs, documents)?",
  },
];

function nextMissing(brief: Brief): (typeof STEPS)[number] | null {
  for (const step of STEPS) {
    if (!brief[step.key]?.trim()) return step;
  }
  return null;
}

function summaryFrom(brief: Brief) {
  return [
    `${brief.service || "delivery"} ${brief.pickup || "?"} → ${brief.dropoff || "?"}`,
    brief.when ? `when ${brief.when}` : "",
    brief.notes ? brief.notes.slice(0, 80) : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

async function maybeOpenAiReply(
  messages: ChatMsg[],
  brief: Brief,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are Mobilare’s UK same-day courier assistant. Collect name, email, phone, service type, pickup/dropoff postcodes, timing, and special requirements. Be concise. When you have enough, confirm you will send the brief to the Mobilare ops team. Never mention CRM admin, admin login, or internal admin pages. Do not invent prices.",
          },
          {
            role: "system",
            content: `Current brief JSON: ${JSON.stringify(brief)}`,
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body.messages || []) as ChatMsg[];
    const brief = { ...(body.brief || {}) } as Brief;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    // Fill next field from last user answer
    if (lastUser) {
      const step = nextMissing(brief);
      if (step) {
        const raw = lastUser.content.trim();
        const err = step.validate?.(raw);
        if (err) {
          return NextResponse.json({
            reply: err,
            brief,
            done: false,
            thread_id: null,
          });
        }
        if (!(step.key === "phone" && /^skip$/i.test(raw))) {
          brief[step.key] = raw;
        } else {
          brief.phone = "";
        }
      }
    }

    const missing = nextMissing(brief);
    if (missing) {
      const ai = await maybeOpenAiReply(messages, brief);
      return NextResponse.json({
        reply: ai || missing.ask,
        brief,
        done: false,
        thread_id: null,
      });
    }

    // Complete — send to CRM
    const details: Record<string, string> = {
      Service: brief.service || "",
      Pickup: brief.pickup || "",
      Dropoff: brief.dropoff || "",
      When: brief.when || "",
      Phone: brief.phone || "",
      Notes: brief.notes || "",
    };
    const summary = summaryFrom(brief);
    const thread = await createAiLeadThread({
      name: brief.name || "Website lead",
      email: brief.email || "unknown@mobilare.co.uk",
      phone: brief.phone,
      summary,
      details,
      transcript: messages,
    });

    return NextResponse.json({
      reply:
        `Perfect — I’ve sent your requirements to our ops team.\n\n` +
        `${summary}\n\n` +
        `Someone will follow up on ${brief.email}. You can also book now at /book.`,
      brief,
      done: true,
      thread_id: thread.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Assistant failed" },
      { status: 500 },
    );
  }
}
