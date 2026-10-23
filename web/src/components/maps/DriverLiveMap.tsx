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

  useEffect(() => {
    if (!sharing || !point || usingFallback) return;
    const supabase = createClient();
    if (!supabase) {
      setPublishMsg("Sign in required to publish live location");
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

  return (
    <div className="space-y-4">
      <div className="admin-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-black text-gray-900">Share live location</p>
          <p className="text-sm text-gray-600 font-light mt-1">
            GPS streams to CRM dispatch and customer track maps.
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

      <RouteMap driver={point} pins={[]} heightClass="min-h-[360px]" />

      {point ? (
        <p className="text-xs text-gray-500 font-mono">
          {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          {point.accuracy != null ? ` · ±${Math.round(point.accuracy)}m` : ""}
        </p>
      ) : null}
    </div>
  );
}
