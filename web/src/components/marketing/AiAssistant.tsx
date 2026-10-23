"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string };
type Brief = Record<string, string>;

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I’m Mobilare’s assistant. Tell me your specific delivery needs and I’ll pass everything to our ops team.",
    },
  ]);
  const [brief, setBrief] = useState<Brief>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || done) return;
    const nextMsgs = [...messages, { role: "user" as const, content }];
    setMessages(nextMsgs);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assistant error");
      setBrief(data.brief || brief);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.done) {
        setDone(true);
        setThreadId(data.thread_id || null);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong — try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-teal text-white font-bold shadow-teal px-5 py-3.5 hover:bg-teal-bright transition"
        aria-expanded={open}
      >
        {open ? "Close assistant" : "AI assistant"}
      </button>

      {open ? (
        <div className="fixed bottom-20 right-5 z-50 w-[min(100vw-1.5rem,380px)] rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[min(70vh,560px)]">
          <div className="bg-ink text-white px-4 py-3">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-teal-bright">
              Mobilare AI
            </p>
            <p className="font-display font-black text-lg">Specific requirements</p>
            <p className="text-xs text-white/60 mt-0.5">
              We’ll pass your requirements to Customer Relation
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#F7FAFB]">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-teal text-white"
                      : "bg-white border border-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {done ? (
            <div className="p-3 border-t border-gray-100 space-y-2 bg-white">
              <p className="text-xs text-teal font-semibold">Sent to Customer Relation</p>
              <Link href="/book" className="btn-primary !py-2 !px-4 text-sm inline-flex">
                Book now
              </Link>
              {threadId ? (
                <p className="text-[10px] text-gray-400 font-mono">Ref {threadId.slice(0, 8)}</p>
              ) : null}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
              <input
                className="input-field !py-2.5"
                placeholder={busy ? "Thinking…" : "Type your answer…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
              />
              <button type="submit" className="btn-primary !py-2.5 !px-4" disabled={busy || !input.trim()}>
                Send
              </button>
            </form>
          )}
        </div>
      ) : null}
    </>
  );
}
