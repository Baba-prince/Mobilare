"use client";

import type { MessengerFace } from "@/lib/messenger";

const KEY = "mobilare_portal_actor_v1";

export function getPortalActor(face: MessengerFace): string {
  if (typeof window === "undefined") return "server";
  try {
    const raw = localStorage.getItem(KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (map[face]) return map[face];
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `actor_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    map[face] = id;
    localStorage.setItem(KEY, JSON.stringify(map));
    return id;
  } catch {
    return `actor_${face}_fallback`;
  }
}
