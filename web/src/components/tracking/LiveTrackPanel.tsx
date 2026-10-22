"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RouteMap } from "@/components/maps/RouteMap";

type TrackPayload = {
  booking_ref?: string;
  status?: string;
  pickup_postcode?: string;
  dropoff_postcode?: string;
  map?: {
    provider?: string | null;
    pickup?: { lat: number; lng: number } | null;
    dropoff?: { lat: number; lng: number } | null;
    route?: {
      distance_metres?: number;
      duration_seconds?: number;
      polyline?: string | null;
    } | null;
    driver?: { lat: number; lng: number } | null;
  };
  job?: {
    status?: string;
    eta_minutes?: number;
    driver_name?: string | null;
    last_lat?: number | null;
    last_lng?: number | null;
  } | null;
  proof_of_delivery?: { lat?: number | null; lng?: number | null } | null;
  error?: string;
};

export function LiveTrackPanel({
  initialRef,
  pollMs = 8000,
  compact = false,
}: {
  initialRef?: string;
  pollMs?: number;
  compact?: boolean;
} = {}) {
  const params = useSearchParams();
  const [ref, setRef] = useState(initialRef || "");
  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const q = initialRef || params.get("ref") || params.get("booking_ref") || "";
    if (q) setRef(q);
  }, [params, initialRef]);

  const lookup = useCallback(async (bookingRef: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setData(null);
    }
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!base || !key) throw new Error("Supabase env missing");
      const res = await fetch(
        `${base}/functions/v1/track?ref=${encodeURIComponent(bookingRef)}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } },
      );
      const json = (await res.json()) as TrackPayload;
      setData(json);
      setLive(true);
    } catch (err) {
      setData({ error: (err as Error).message });
      setLive(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = initialRef || params.get("ref") || params.get("booking_ref");
    if (q) void lookup(q);
  }, [params, initialRef, lookup]);

  // Live poll while tracking an open job
  useEffect(() => {
    if (!ref.trim() || !live) return;
    const status = data?.status || "";
    if (["delivered", "cancelled"].includes(status)) return;
    const id = window.setInterval(() => void lookup(ref.trim(), true), pollMs);
    return () => window.clearInterval(id);
  }, [ref, live, data?.status, pollMs, lookup]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (ref.trim()) void lookup(ref.trim());
  }

  const driverPos =
    data?.map?.driver ||
    (data?.job?.last_lat != null && data?.job?.last_lng != null
      ? { lat: data.job.last_lat, lng: data.job.last_lng }
      : null);

  const podPin =
    data?.proof_of_delivery?.lat != null && data?.proof_of_delivery?.lng != null
      ? [
          {
            lat: data.proof_of_delivery.lat,
            lng: data.proof_of_delivery.lng,
            label: "POD",
            title: "Proof of delivery",
          },
        ]
      : [];

  const mapBlock = (
    <RouteMap
      pickup={data?.map?.pickup}
      dropoff={data?.map?.dropoff}
      driver={driverPos}
      pins={podPin}
      encodedPolyline={data?.map?.route?.polyline}
      heightClass={compact ? "min-h-[220px]" : "min-h-[320px]"}
    />
  );

  return (
    <div className={compact ? "space-y-4" : "grid lg:grid-cols-2 gap-6"}>
      <div className="space-y-4">
        {!compact ? (
          <form onSubmit={onSubmit} className="card-soft space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Booking reference
              <input
                className="input-field mt-1"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="MB-XXXXXXXX"
                required
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Looking up…" : "Track delivery"}
            </button>
          </form>
        ) : null}

        {data?.error ? <p className="text-red-600 text-sm">{data.error}</p> : null}

        {data && !data.error ? (
          <div className="card-soft space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-500">Booking</p>
              {live ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                  Live · {Math.round(pollMs / 1000)}s
                </span>
              ) : null}
            </div>
            <p className="font-black text-xl">{data.booking_ref}</p>
            <p>
              Status: <span className="text-teal font-semibold">{data.status}</span>
            </p>
            <p className="text-sm text-gray-600">
              {data.pickup_postcode} → {data.dropoff_postcode}
            </p>
            {data.job ? (
              <p className="text-sm text-gray-500">
                Job {data.job.status}
                {data.job.eta_minutes != null ? ` · ETA ~${data.job.eta_minutes} min` : ""}
                {data.job.driver_name ? ` · ${data.job.driver_name}` : ""}
              </p>
            ) : null}
            {data.map?.route?.distance_metres ? (
              <p className="text-xs text-gray-500">
                Route {(data.map.route.distance_metres / 1609.34).toFixed(1)} mi
                {data.map.route.duration_seconds
                  ? ` · ~${Math.round(data.map.route.duration_seconds / 60)} min drive`
                  : ""}
              </p>
            ) : null}
            {driverPos ? (
              <p className="text-xs text-teal font-semibold">Driver location on map</p>
            ) : null}
            {!data.map?.provider ? (
              <p className="text-xs text-amber-700">
                Map coordinates require GOOGLE_MAPS_API_KEY on the server.
              </p>
            ) : null}
          </div>
        ) : null}
        {compact ? mapBlock : null}
      </div>

      {!compact ? mapBlock : null}
    </div>
  );
}
