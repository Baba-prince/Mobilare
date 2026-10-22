"use client";

import { useEffect, useState } from "react";
import { RouteMap } from "@/components/maps/RouteMap";
import { useGeolocation } from "@/hooks/useGeolocation";
import { createClient } from "@/lib/supabase/client";

export function DriverLiveMap() {
  const [sharing, setSharing] = useState(true);
  const { point, error, usingFallback } = useGeolocation({
    watch: true,
    enabled: sharing,
  });
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [jobPins, setJobPins] = useState<
    { lat: number; lng: number; label: string; title: string }[]
  >([]);

  // Publish heartbeat to Supabase when available
  useEffect(() => {
    if (!sharing || !point || usingFallback) return;
    const supabase = createClient();
    if (!supabase) {
      setPublishMsg("Demo GPS (sign in + DB to publish live location)");
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        if (!cancelled) setPublishMsg("Sign in as a driver to publish location to CRM / track");
        return;
      }
      const { error: rpcErr } = await supabase.rpc("publish_driver_location", {
        p_lat: point.lat,
        p_lng: point.lng,
        p_accuracy_m: point.accuracy ?? null,
      });
      if (cancelled) return;
      if (rpcErr) setPublishMsg(rpcErr.message);
      else setPublishMsg(`Published ${new Date(point.at).toLocaleTimeString()}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [point, sharing, usingFallback]);

  // Demo job pins around driver (or London) for map context
  useEffect(() => {
    if (!point) return;
    setJobPins([
      {
        lat: point.lat + 0.02,
        lng: point.lng + 0.015,
        label: "J1",
        title: "Queued job nearby",
      },
      {
        lat: point.lat - 0.015,
        lng: point.lng + 0.01,
        label: "J2",
        title: "Available job",
      },
    ]);
  }, [point]);

  return (
    <div className="space-y-4">
      <div className="admin-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-gray-900">Share live location</p>
          <p className="text-sm text-gray-600 font-light mt-1">
            GPS streams to CRM dispatch and customer track maps (jobs.last_lat/lng).
          </p>
        </div>
        <button
          type="button"
          className={sharing ? "btn-primary" : "btn-secondary"}
          onClick={() => setSharing((v) => !v)}
        >
          {sharing ? "Sharing on" : "Sharing off"}
        </button>
      </div>

      {error ? <p className="text-sm text-amber-700">{error}</p> : null}
      {usingFallback ? (
        <p className="text-xs text-amber-700">
          Using city fallback until location permission is granted.
        </p>
      ) : null}
      {publishMsg ? <p className="text-xs text-gray-500">{publishMsg}</p> : null}

      <RouteMap
        driver={point}
        pins={jobPins}
        heightClass="min-h-[360px]"
      />

      {point ? (
        <p className="text-xs text-gray-500 font-mono">
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          {point.accuracy != null ? ` · ±${Math.round(point.accuracy)}m` : ""}
        </p>
      ) : null}
    </div>
  );
}
