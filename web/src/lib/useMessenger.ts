"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  mapConversation,
  mapMessage,
  type MessengerFace,
  type MessengerMessage,
  type MessengerThread,
} from "@/lib/messenger";
import {
  ensureDemoThread,
  getDemoSnapshot,
  markDemoRead,
  messagesForThread as demoMessages,
  sendDemoMessage,
  subscribeDemoMessenger,
  threadsForFace as demoThreads,
} from "@/lib/messenger-demo";

type ProfileLite = { id: string; role: string; full_name: string | null };

export function useMessenger(face: MessengerFace) {
  const [threads, setThreads] = useState<MessengerThread[]>([]);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, MessengerMessage[]>>(
    {},
  );
  const [activeId, setActiveId] = useState<string | undefined>();
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshDemo = useCallback(() => {
    const list = demoThreads(face);
    setThreads(list);
    setMessagesByThread((prev) => {
      const next = { ...prev };
      for (const t of list) next[t.id] = demoMessages(t.id);
      return next;
    });
    setMode("demo");
    setLoading(false);
  }, [face]);

  const loadLive = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      refreshDemo();
      return;
    }

    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      refreshDemo();
      return;
    }

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const resolved: ProfileLite = {
      id: user.id,
      role: (prof?.role as string) || (user.user_metadata?.role as string) || "customer",
      full_name: (prof?.full_name as string) || null,
    };
    setProfile(resolved);

    let query = supabase
      .from("conversations")
      .select(
        "id, title, kind, type, status, customer_profile_id, driver_profile_id, booking_id, last_message_at, last_message_preview, created_at",
      )
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (face === "customer") {
      query = query.eq("customer_profile_id", user.id).eq("kind", "support");
    } else if (face === "driver") {
      query = query.eq("driver_profile_id", user.id).in("kind", ["driver_ops", "job"]);
    }
    // crm: all rows RLS allows

    const { data: rows, error: qErr } = await query;
    if (qErr) {
      setError(qErr.message);
      refreshDemo();
      return;
    }

    const mapped = (rows || []).map((r) => mapConversation(r as Record<string, unknown>, face, 0));
    setThreads(mapped);
    setMode("live");
    setLoading(false);

    if (mapped[0] && !activeId) setActiveId(mapped[0].id);
  }, [face, refreshDemo, activeId]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (mode !== "live") {
        setMessagesByThread((prev) => ({
          ...prev,
          [conversationId]: demoMessages(conversationId),
        }));
        return;
      }
      const supabase = createClient();
      if (!supabase) return;
      const { data, error: mErr } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_type, sender_face, sender_profile_id, body, created_at",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (mErr) {
        setError(mErr.message);
        return;
      }
      setMessagesByThread((prev) => ({
        ...prev,
        [conversationId]: (data || []).map((r) => mapMessage(r as Record<string, unknown>)),
      }));
      await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
    },
    [mode],
  );

  useEffect(() => {
    void loadLive();
  }, [loadLive]);

  useEffect(() => {
    if (mode !== "demo") return;
    refreshDemo();
    return subscribeDemoMessenger(refreshDemo);
  }, [mode, refreshDemo]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Realtime
  useEffect(() => {
    if (mode !== "live") return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`mobilare-messenger-${face}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (!row?.conversation_id) return;
          const cid = String(row.conversation_id);
          if (cid === activeId) void loadMessages(cid);
          void loadLive();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          void loadLive();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [mode, face, activeId, loadLive, loadMessages]);

  const messages = useMemo(
    () => (activeId ? messagesByThread[activeId] || [] : []),
    [activeId, messagesByThread],
  );

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unread || 0), 0),
    [threads],
  );

  async function ensureThread(subject?: string, context?: string) {
    setBusy(true);
    setError(null);
    try {
      if (mode !== "live") {
        const t = ensureDemoThread(face === "crm" ? "customer" : face);
        setActiveId(t.id);
        refreshDemo();
        return t.id;
      }
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase unavailable");

      if (face === "driver") {
        const { data, error: rpcErr } = await supabase.rpc("open_driver_thread", {
          p_subject: subject || "Driver desk",
          p_context: context || null,
        });
        if (rpcErr) throw rpcErr;
        const id = String((data as { id: string }).id);
        await loadLive();
        setActiveId(id);
        return id;
      }

      if (face === "customer") {
        const { data, error: rpcErr } = await supabase.rpc("open_support_thread", {
          p_subject: subject || "Support",
          p_context: context || null,
        });
        if (rpcErr) throw rpcErr;
        const id = String((data as { id: string }).id);
        await loadLive();
        setActiveId(id);
        return id;
      }

      // CRM: pick first or create support for self if empty
      if (threads[0]) {
        setActiveId(threads[0].id);
        return threads[0].id;
      }
      const { data, error: rpcErr } = await supabase.rpc("open_support_thread", {
        p_subject: "Support",
        p_context: "CRM inbox ready",
      });
      if (rpcErr) throw rpcErr;
      const id = String((data as { id: string }).id);
      await loadLive();
      setActiveId(id);
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
    if (!text) return;
    let threadId = activeId;
    if (!threadId) {
      threadId = await ensureThread();
      if (!threadId) return;
    }

    setBusy(true);
    setError(null);
    try {
      if (mode !== "live") {
        sendDemoMessage(threadId, face, text);
        refreshDemo();
        return;
      }
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase unavailable");
      const { error: rpcErr } = await supabase.rpc("send_portal_message", {
        p_conversation_id: threadId,
        p_body: text,
      });
      if (rpcErr) throw rpcErr;
      await loadMessages(threadId);
      await loadLive();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function markRead(threadId: string) {
    if (mode !== "live") {
      markDemoRead(threadId, face);
      refreshDemo();
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    await supabase.rpc("mark_conversation_read", { p_conversation_id: threadId });
  }

  return {
    threads,
    messages,
    activeId,
    setActiveId,
    profile,
    mode,
    loading,
    error,
    busy,
    unreadTotal,
    ensureThread,
    send,
    markRead,
    refresh: loadLive,
  };
}
