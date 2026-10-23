"use client";

import { FormEvent, useEffect, useState } from "react";
import { FACE_COLOR, FACE_LABEL, type MessengerFace } from "@/lib/messenger";
import { useMessenger } from "@/lib/useMessenger";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MessengerApp({
  face,
  title = "Messages",
  initialThreadId,
  emptyHint,
}: {
  face: MessengerFace;
  title?: string;
  initialThreadId?: string;
  emptyHint?: string;
}) {
  const {
    threads,
    messages,
    activeId,
    setActiveId,
    loading,
    error,
    busy,
    unreadTotal,
    ensureThread,
    send,
    markRead,
  } = useMessenger(face);
  const [draft, setDraft] = useState("");
  const [split, setSplit] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 820px)");
    const apply = () => setSplit(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (initialThreadId) setActiveId(initialThreadId);
  }, [initialThreadId, setActiveId]);

  useEffect(() => {
    if (!activeId && threads[0]) setActiveId(threads[0].id);
  }, [threads, activeId, setActiveId]);

  useEffect(() => {
    if (activeId) void markRead(activeId);
  }, [activeId, markRead, messages.length]);

  const active = threads.find((t) => t.id === activeId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft;
    setDraft("");
    await send(text);
  }

  return (
    <div className="admin-card !p-0 overflow-hidden min-h-[520px] flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <div>
          <h1 className="font-display text-xl font-black text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            As {FACE_LABEL[face]}
            {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}
            {" · live"}
          </p>
        </div>
        {(face === "customer" || face === "driver") && (
          <button
            type="button"
            className="btn-secondary !py-2 !px-4 text-sm"
            disabled={busy}
            onClick={() => void ensureThread()}
          >
            New thread
          </button>
        )}
      </div>

      {error ? (
        <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</p>
      ) : null}

      <div className={`flex-1 grid ${split ? "md:grid-cols-[280px_1fr]" : "grid-cols-1"} min-h-0`}>
        <aside className="border-r border-gray-100 bg-[#FAFBFC] max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading…</p>
          ) : threads.length === 0 ? (
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-500">
                {emptyHint || "No threads yet."}
              </p>
              {(face === "customer" || face === "driver") && (
                <button
                  type="button"
                  className="btn-primary !py-2 !px-4 text-sm"
                  onClick={() => void ensureThread()}
                >
                  Start conversation
                </button>
              )}
            </div>
          ) : (
            <ul>
              {threads.map((t) => {
                const on = t.id === activeId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(t.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${
                        on ? "bg-teal/10" : "hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${on ? "text-teal" : "text-gray-900"}`}>
                          {t.subject}
                        </p>
                        {t.unread > 0 ? (
                          <span className="shrink-0 rounded-full bg-teal text-white text-[10px] font-bold px-1.5 py-0.5">
                            {t.unread}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.context}</p>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-1">
                        {t.kind.replace(/_/g, " ")}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="flex flex-col min-h-[420px] bg-white">
          {active ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{active.subject}</p>
                <p className="text-xs text-gray-500">{active.context}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[50vh]">
                {messages.map((m) => {
                  const mine = m.from === face;
                  const color = FACE_COLOR[m.from];
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          mine ? "bg-teal text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
                            mine ? "text-white/80" : ""
                          }`}
                          style={!mine ? { color } : undefined}
                        >
                          {FACE_LABEL[m.from]}
                        </p>
                        <p className="whitespace-pre-wrap font-light leading-relaxed">{m.body}</p>
                        <p
                          className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-gray-400"}`}
                        >
                          {formatTime(m.at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={onSubmit} className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  className="input-field !py-2.5"
                  placeholder={`Message as ${FACE_LABEL[face]}…`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={busy}
                />
                <button type="submit" className="btn-primary !py-2.5 !px-5" disabled={busy || !draft.trim()}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-gray-500">
              Select a thread or start a new conversation with CRM.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
