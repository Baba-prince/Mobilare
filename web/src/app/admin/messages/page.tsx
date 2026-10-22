import type { Metadata } from "next";
import { MessengerApp } from "@/components/messenger/MessengerApp";

export const metadata: Metadata = { title: "CRM inbox" };

export default function AdminMessagesPage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <p className="eyebrow">Inbox</p>
        <h1 className="font-display text-3xl font-black text-gray-900 mt-1">
          Customers & drivers
        </h1>
        <p className="text-sm text-gray-600 font-light mt-2 max-w-2xl">
          Support messages from customer profiles and driver desk threads land here. Reply as CRM
          — both portals update live.
        </p>
      </div>
      <MessengerApp
        face="crm"
        title="CRM Tri-inbox"
        emptyHint="No open threads yet. When a customer or driver messages, they appear here."
      />
    </div>
  );
}
