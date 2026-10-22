"use client";

import { useEffect, useState } from "react";
import { RouteMap, type MapPin } from "@/components/maps/RouteMap";
import { createClient } from "@/lib/supabase/client";

type DriverRow = {
  driver_profile_id: string;
  lat: number;
  lng: number;
  updated_at: string;
};

const DEMO_PINS: MapPin[] = [
  { lat: 51.5155, lng: -0.0922, label: "D1", title: "Driver · City" },
  { lat: 51.5074, lng: -0.1278, label: "J", title: "Job · EC1 → SW1" },
  { lat: 51.52, lng: -0.15, label: "D2", title: "Driver · West" },
];

export function DispatchMap() {
  const [pins, setPins] = useState<MapPin[]>(DEMO_PINS);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [meta, setMeta] = useState("Demo fleet pins — connect DB for live drivers");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;

    async function load() {
      const { data: session } = await supabase!.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase!
        .from("driver_locations")
        .select("driver_profile_id, lat, lng, updated_at")
        .order("updated_at", { ascending: false })
        .limit(40);

      if (cancelled) return;
      if (error || !data?.length) {
        setMode("demo");
        setMeta(error?.message || "No live drivers yet — showing demo pins");
        setPins(DEMO_PINS);
        return;
      }

      const mapped: MapPin[] = (data as DriverRow[]).map((d, i) => ({
        id: d.driver_profile_id,
        lat: d.lat,
        lng: d.lng,
        label: `D${i + 1}`,
        title: `Driver · ${new Date(d.updated_at).toLocaleTimeString()}`,
      }));
      setPins(mapped);
      setMode("live");
      setMeta(`${mapped.length} live driver location${mapped.length === 1 ? "" : "s"}`);
    }

    void load();
    const channel = supabase
      .channel("crm-dispatch-drivers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        () => void load(),
      )
      .subscribe();

    const poll = window.setInterval(() => void load(), 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600 font-light">{meta}</p>
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
          {mode === "live" ? "Live Google map" : "Demo map"}
        </span>
      </div>
      <RouteMap pins={pins} heightClass="min-h-[420px]" />
    </div>
  );
}
