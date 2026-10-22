import type { Metadata } from "next";
import { DispatchMap } from "@/components/maps/DispatchMap";

export const metadata: Metadata = { title: "Dispatch map" };

export default function AdminMapPage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <p className="eyebrow">CRM · Google Maps</p>
        <h1 className="font-display text-3xl font-black text-gray-900 mt-1">
          Dispatch map
        </h1>
        <p className="text-sm text-gray-600 font-light mt-2 max-w-2xl">
          Live driver pins from GPS heartbeats. Customers see the same driver location on{" "}
          <code className="text-xs">/track</code>.
        </p>
      </div>
      <div className="admin-card !p-4">
        <DispatchMap />
      </div>
    </div>
  );
}
