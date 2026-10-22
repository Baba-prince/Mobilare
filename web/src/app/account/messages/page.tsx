import type { Metadata } from "next";
import { MessengerApp } from "@/components/messenger/MessengerApp";

export const metadata: Metadata = { title: "Support messages" };

export default function AccountMessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Support</p>
        <p className="text-sm text-gray-600 font-light mt-1 max-w-2xl">
          Message Mobilare CRM from your profile. Replies appear here in real time — same inbox
          ops uses in Admin.
        </p>
      </div>
      <MessengerApp
        face="customer"
        title="Support with CRM"
        emptyHint="Start a support thread — CRM receives it in the admin inbox."
      />
    </div>
  );
}
