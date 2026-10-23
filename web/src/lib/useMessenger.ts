"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MessengerFace, MessengerMessage, MessengerThread } from "@/lib/messenger";
import { getPortalActor } from "@/lib/portal-actor";

function headers(face: MessengerFace, actor: string) {
  return {
    "Content-Type": "application/json",
    "x-mobilare-face": face,
    "x-mobilare-actor": actor,
  };
}

export function useMessenger(face: MessengerFace) {
  const [threads, setThreads] = useState<MessengerThread[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, MessengerMessage[]>>(
    {},
  );
  const [activeId, setActiveId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actor, setActor] = useState<string>("");

  useEffect(() => {
    setActor(getPortalActor(face));
  }, [face]);

  const loadThreads = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/messaging/threads", {
        headers: headers(face, actor),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load threads");
      const list = (data.threads || []) as MessengerThread[];
      setThreads(list);
      if (!activeId && list[0]) setActiveId(list[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [actor, face, activeId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(
        `/api/messaging/messages?threadId=${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load messages");
      setMessagesByThread((prev) => ({
        ...prev,
        [conversationId]: (data.messages || []) as MessengerMessage[],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load messages");
    }
  }, []);

  useEffect(() => {
    if (!actor) return;
    void loadThreads();
  }, [actor, loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Near-realtime poll (shared server store across portals)
  useEffect(() => {
    if (!actor) return;
    const id = window.setInterval(() => {
      void loadThreads();
      if (activeId) void loadMessages(activeId);
    }, 3000);
    return () => window.clearInterval(id);
  }, [actor, activeId, loadThreads, loadMessages]);

  const messages = useMemo(
    () => (activeId ? messagesByThread[activeId] || [] : []),
    [activeId, messagesByThread],
  );

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unread || 0), 0),
    [threads],
  );

  async function ensureThread(subject?: string, context?: string) {
    if (!actor) return undefined;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messaging/threads", {
        method: "POST",
        headers: headers(face, actor),
        body: JSON.stringify({ subject, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open thread");
      const id = String(data.thread.id);
      await loadThreads();
      setActiveId(id);
      await loadMessages(id);
      return id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open thread");
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function send(body: string) {
    const text = body.trim();
    if (!text || !actor) return;
    let threadId = activeId;
    if (!threadId) {
      threadId = await ensureThread();
      if (!threadId) return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messaging/messages", {
        method: "POST",
        headers: headers(face, actor),
        body: JSON.stringify({ threadId, body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      await loadMessages(threadId);
      await loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function markRead(_threadId: string) {
    /* unread counters optional in file store */
  }

  return {
    threads,
    messages,
    activeId,
    setActiveId,
    profile: null,
    mode: "portal" as const,
    loading,
    error,
    busy,
    unreadTotal,
    ensureThread,
    send,
    markRead,
    refresh: loadThreads,
  };
}
