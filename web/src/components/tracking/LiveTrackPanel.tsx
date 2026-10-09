"use client";

import { FormEvent, useEffect, useState } from "react";
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
  };
  job?: { status?: string; eta_minutes?: number; driver_name?: string | null } | null;
  error?: string;
};

export function LiveTrackPanel() {
  const params = useSearchParams();
  const [ref, setRef] = useState("");
  const [data, setData] = useState<TrackPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = params.get("ref") || params.get("booking_ref") || "";
    if (q) setRef(q);
  }, [params]);

  async function lookup(bookingRef: string) {
    setLoading(true);
    setData(null);
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
    } catch (err) {
      setData({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const q = params.get("ref") || params.get("booking_ref");
    if (q) lookup(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (ref.trim()) lookup(ref.trim());
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
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

        {data?.error ? <p className="text-red-600 text-sm">{data.error}</p> : null}

        {data && !data.error ? (
          <div className="card-soft space-y-2">
            <p className="text-sm text-gray-500">Booking</p>
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
            {!data.map?.provider ? (
              <p className="text-xs text-amber-700">
                Map coordinates require GOOGLE_MAPS_API_KEY on the server.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <RouteMap pickup={data?.map?.pickup} dropoff={data?.map?.dropoff} />
    </div>
  );
}
