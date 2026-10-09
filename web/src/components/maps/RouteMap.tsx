"use client";

import { useEffect, useRef, useState } from "react";
import { googleMapsBrowserKey, loadGoogleMaps } from "@/lib/google-maps";

type LatLng = { lat: number; lng: number };

type Props = {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  className?: string;
};

export function RouteMap({ pickup, dropoff, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pickup && !dropoff) return;
    if (!googleMapsBrowserKey()) {
      setError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live maps.");
      return;
    }

    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !ref.current) return;
        const center = pickup || dropoff!;
        const map = new g.maps.Map(ref.current, {
          center,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
          ],
        });
        const bounds = new g.maps.LatLngBounds();
        if (pickup) {
          new g.maps.Marker({
            map,
            position: pickup,
            title: "Pickup",
            label: "P",
          });
          bounds.extend(pickup);
        }
        if (dropoff) {
          new g.maps.Marker({
            map,
            position: dropoff,
            title: "Drop-off",
            label: "D",
          });
          bounds.extend(dropoff);
        }
        if (pickup && dropoff) {
          map.fitBounds(bounds, 48);
          new g.maps.Polyline({
            map,
            path: [pickup, dropoff],
            strokeColor: "#0D6E7F",
            strokeWeight: 4,
            strokeOpacity: 0.85,
          });
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff]);

  if (error) {
    return (
      <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${className}`}>
        {error}
      </div>
    );
  }

  if (!pickup && !dropoff) {
    return (
      <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 ${className}`}>
        Map appears when pickup / drop-off coordinates are available.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`min-h-[280px] w-full rounded-2xl border border-gray-200 overflow-hidden ${className}`}
    />
  );
}
