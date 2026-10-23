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

export function DispatchMap() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [live, setLive] = useState(false);
  const [meta, setMeta] = useState("Waiting for live driver locations…");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setMeta("Maps connected — sign in with CRM access to load live drivers");
      return;
    }

    let cancelled = false;

    async function load() {
      const { data: session } = await supabase!.auth.getSession();
      if (!session.session) {
        if (!cancelled) {
          setLive(false);
          setPins([]);
          setMeta("Sign in as admin to see live driver locations");
        }
        return;
      }

      const { data, error } = await supabase!
        .from("driver_locations")
        .select("driver_profile_id, lat, lng, updated_at")
        .order("updated_at", { ascending: false })
        .limit(40);

      if (cancelled) return;
      if (error || !data?.length) {
        setLive(false);
        setPins([]);
        setMeta(error?.message || "No drivers sharing location yet");
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
      setLive(true);
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
          {live ? "Live Google map" : "Awaiting drivers"}
        </span>
      </div>
      <RouteMap pins={pins} heightClass="min-h-[420px]" />
    </div>
  );
}
