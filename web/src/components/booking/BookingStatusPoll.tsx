"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type TrackPayload = {
  booking_ref?: string;
  status?: string;
  job?: { status?: string; eta_minutes?: number } | null;
  error?: string;
};

export function BookingStatusPoll() {
  const params = useSearchParams();
  const ref = params.get("booking_ref") || "";
  const [data, setData] = useState<TrackPayload | null>(null);

  useEffect(() => {
    if (!ref) return;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!base || !key) {
      setData({ booking_ref: ref, status: "paid", job: { status: "queued", eta_minutes: 90 } });
      return;
    }

    let alive = true;
    async function tick() {
      try {
        const res = await fetch(`${base}/functions/v1/track?ref=${encodeURIComponent(ref)}`, {
          headers: { apikey: key!, Authorization: `Bearer ${key}` },
        });
        const json = (await res.json()) as TrackPayload;
        if (alive) setData(json);
      } catch {
        if (alive) setData({ error: "Could not reach track API", booking_ref: ref });
      }
    }
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [ref]);

  if (!ref) {
    return <p className="text-gray-600">Missing booking reference.</p>;
  }

  return (
    <div className="card-soft space-y-3">
      <p className="text-sm text-gray-500">Booking ref</p>
      <p className="font-black text-2xl text-gray-900">{ref}</p>
      <p className="text-gray-600">
        Status: <span className="font-semibold text-teal">{data?.status ?? "checking…"}</span>
      </p>
      {data?.job ? (
        <p className="text-sm text-gray-500">
          Job {data.job.status}
          {data.job.eta_minutes != null ? ` · ETA ~${data.job.eta_minutes} min` : ""}
        </p>
      ) : null}
      <Link href={`/track?ref=${encodeURIComponent(ref)}`} className="btn-primary inline-flex mt-4">
        Track this delivery
      </Link>
    </div>
  );
}
