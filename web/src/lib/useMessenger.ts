"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MessengerFace, MessengerMessage, MessengerThread } from "@/lib/messenger";
import { getPortalActor } from "@/lib/portal-actor";

function headers(face: MessengerFace, actor: string) {
  return {
    "Content-Type": "application/json",
    "x-mobilare-face": face,
    "x-mobilare-actor": actor,
  };
}

function sameThreads(a: MessengerThread[], b: MessengerThread[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.lastMessageAt !== y.lastMessageAt ||
      x.lastMessagePreview !== y.lastMessagePreview ||
      x.unread !== y.unread ||
      x.subject !== y.subject
    ) {
      return false;
    }
  }
  return true;
}

function sameMessages(a: MessengerMessage[], b: MessengerMessage[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].body !== b[i].body) return false;
  }
  return true;
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

  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const initialLoadDone = useRef(false);

  useEffect(() => {
    setActor(getPortalActor(face));
  }, [face]);

  const loadThreads = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!actor) return;
      const silent = opts?.silent ?? false;
      if (!silent && !initialLoadDone.current) setLoading(true);
      if (!silent) setError(null);
      try {
        const res = await fetch("/api/messaging/threads", {
          headers: headers(face, actor),
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load threads");
        const list = (data.threads || []) as MessengerThread[];
        setThreads((prev) => (sameThreads(prev, list) ? prev : list));
        if (!activeIdRef.current && list[0]) setActiveId(list[0].id);
      } catch (e) {
        if (!silent) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!silent) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    },
    [actor, face],
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(
        `/api/messaging/messages?threadId=${encodeURIComponent(conversationId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load messages");
      const next = (data.messages || []) as MessengerMessage[];
      setMessagesByThread((prev) => {
        const cur = prev[conversationId] || [];
        if (sameMessages(cur, next)) return prev;
        return { ...prev, [conversationId]: next };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load messages");
    }
  }, []);

  useEffect(() => {
    if (!actor) return;
    initialLoadDone.current = false;
    void loadThreads({ silent: false });
  }, [actor, loadThreads]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Silent poll — do not toggle loading (avoids blink)
  useEffect(() => {
    if (!actor) return;
    const id = window.setInterval(() => {
      void loadThreads({ silent: true });
      const tid = activeIdRef.current;
      if (tid) void loadMessages(tid);
    }, 4000);
    return () => window.clearInterval(id);
  }, [actor, loadThreads, loadMessages]);

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
      await loadThreads({ silent: true });
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
      await loadThreads({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function markRead(_threadId: string) {
    /* unread counters optional in file store */
  }

  async function removeMessage(messageId: string) {
    if (!actor || !messageId) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/messaging/messages?messageId=${encodeURIComponent(messageId)}`,
        { method: "DELETE", headers: headers(face, actor) },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      const tid = activeIdRef.current;
      if (tid) await loadMessages(tid);
      await loadThreads({ silent: true });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function removeThread(threadId: string) {
    if (!actor || !threadId) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/messaging/threads?threadId=${encodeURIComponent(threadId)}`,
        { method: "DELETE", headers: headers(face, actor) },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMessagesByThread((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
      if (activeIdRef.current === threadId) setActiveId(undefined);
      await loadThreads({ silent: true });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      return false;
    } finally {
      setBusy(false);
    }
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
    removeMessage,
    removeThread,
    refresh: () => loadThreads({ silent: false }),
  };
}
