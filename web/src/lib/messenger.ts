export type MessengerFace = "customer" | "driver" | "crm";

export type MessengerThread = {
  id: string;
  subject: string;
  context: string;
  kind: string;
  status: string;
  customerProfileId: string | null;
  driverProfileId: string | null;
  bookingId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: number;
  updatedAt: string;
};

export type MessengerMessage = {
  id: string;
  conversationId: string;
  from: MessengerFace | "system";
  body: string;
  at: string;
  senderProfileId: string | null;
};

export const FACE_LABEL: Record<MessengerFace | "system", string> = {
  customer: "Customer",
  driver: "Driver",
  crm: "CRM",
  system: "System",
};

export const FACE_COLOR: Record<MessengerFace | "system", string> = {
  customer: "#0D6E7F",
  driver: "#1A5C8A",
  crm: "#C45C26",
  system: "#6B7280",
};

export function faceFromSender(raw: string | null | undefined): MessengerFace | "system" {
  const v = (raw || "").toLowerCase();
  if (v === "customer" || v === "driver" || v === "crm" || v === "system") return v;
  if (v === "admin" || v === "ops") return "crm";
  return "system";
}

export function mapConversation(
  row: Record<string, unknown>,
  face: MessengerFace,
  unread = 0,
): MessengerThread {
  const kind = String(row.kind || row.type || "support");
  const title = String(row.title || "Conversation");
  const preview = row.last_message_preview ? String(row.last_message_preview) : "";
  return {
    id: String(row.id),
    subject: title,
    context: preview || kind.replace(/_/g, " "),
    kind,
    status: String(row.status || "open"),
    customerProfileId: row.customer_profile_id ? String(row.customer_profile_id) : null,
    driverProfileId: row.driver_profile_id ? String(row.driver_profile_id) : null,
    bookingId: row.booking_id ? String(row.booking_id) : null,
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    lastMessagePreview: preview || null,
    unread,
    updatedAt: String(row.last_message_at || row.created_at || new Date().toISOString()),
  };
}

export function mapMessage(row: Record<string, unknown>): MessengerMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    from: faceFromSender(
      (row.sender_face as string) || (row.sender_type as string) || "system",
    ),
    body: String(row.body || ""),
    at: String(row.created_at || new Date().toISOString()),
    senderProfileId: row.sender_profile_id ? String(row.sender_profile_id) : null,
  };
}

/** Demo store key — used only when Supabase session is unavailable. */
export const DEMO_MESSENGER_KEY = "mobilare_messenger_v1";
