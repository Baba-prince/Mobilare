import type { Metadata } from "next";
import { MessengerApp } from "@/components/messenger/MessengerApp";

export const metadata: Metadata = { title: "Driver messages" };

export default function DriverMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Dispatch</p>
        <p className="text-sm text-gray-600 font-light mt-1 max-w-2xl">
          Talk to CRM / dispatch about jobs, corridors, and POD issues. Live two-way chat — not a
          static form.
        </p>
      </div>
      <MessengerApp
        face="driver"
        title="Driver ↔ CRM"
        emptyHint="Open a driver desk thread to reach ops."
      />
    </div>
  );
}
