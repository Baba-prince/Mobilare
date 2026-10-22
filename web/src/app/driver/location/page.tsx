import type { Metadata } from "next";
import { DriverLiveMap } from "@/components/maps/DriverLiveMap";

export const metadata: Metadata = { title: "Live location" };

export default function DriverLocationPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Google Maps · GPS</p>
        <h1 className="font-display text-3xl font-black text-gray-900 mt-1">Live location</h1>
        <p className="text-sm text-gray-600 font-light mt-2 max-w-2xl">
          Share your position with CRM dispatch and customer track pages — same Maps stack as
          RoadAngel rescue map, plus continuous publish to Supabase.
        </p>
      </div>
      <DriverLiveMap />
    </div>
  );
}
