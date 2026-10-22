"use client";

import { useEffect, useRef, useState } from "react";
import { googleMapsBrowserKey, loadGoogleMaps } from "@/lib/google-maps";
import { decodePolyline } from "@/lib/polyline";

export type LatLng = { lat: number; lng: number };

export type MapPin = LatLng & {
  id?: string;
  label?: string;
  title?: string;
  color?: string;
};

type Props = {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  /** Live driver / fleet pin */
  driver?: LatLng | null;
  /** Extra pins (jobs, POD, etc.) */
  pins?: MapPin[];
  /** Google encoded polyline from Routes API */
  encodedPolyline?: string | null;
  className?: string;
  heightClass?: string;
};

type MapLike = {
  fitBounds: (bounds: unknown, padding?: number) => void;
  setCenter: (c: LatLng) => void;
  setZoom: (z: number) => void;
};

export function RouteMap({
  pickup,
  dropoff,
  driver,
  pins = [],
  encodedPolyline,
  className = "",
  heightClass = "min-h-[280px]",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const hasAnything = Boolean(pickup || dropoff || driver || pins.length);

  useEffect(() => {
    if (!hasAnything) return;
    if (!googleMapsBrowserKey()) {
      setError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live maps.");
      return;
    }

    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !ref.current) return;
        const center = driver || pickup || dropoff || pins[0]!;
        const map = new g.maps.Map(ref.current, {
          center,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        }) as MapLike;

        const bounds = new g.maps.LatLngBounds();
        let extended = false;

        const extend = (p: LatLng) => {
          bounds.extend(p);
          extended = true;
        };

        if (pickup) {
          new g.maps.Marker({
            map,
            position: pickup,
            title: "Pickup",
            label: { text: "P", color: "#fff", fontWeight: "700" },
          });
          extend(pickup);
        }
        if (dropoff) {
          new g.maps.Marker({
            map,
            position: dropoff,
            title: "Drop-off",
            label: { text: "D", color: "#fff", fontWeight: "700" },
          });
          extend(dropoff);
        }
        if (driver) {
          new g.maps.Marker({
            map,
            position: driver,
            title: "Driver",
            label: { text: "●", color: "#0D6E7F", fontWeight: "900" },
          });
          extend(driver);
        }
        for (const pin of pins) {
          new g.maps.Marker({
            map,
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.title || pin.label || "Pin",
            label: pin.label
              ? { text: pin.label.slice(0, 2), color: "#fff", fontWeight: "700" }
              : undefined,
          });
          extend(pin);
        }

        let path: LatLng[] | null = null;
        if (encodedPolyline) {
          try {
            path = decodePolyline(encodedPolyline);
          } catch {
            path = null;
          }
        }
        if (!path?.length && pickup && dropoff) {
          path = [pickup, dropoff];
        }
        if (path?.length) {
          new g.maps.Polyline({
            map,
            path,
            strokeColor: "#0D6E7F",
            strokeWeight: 4,
            strokeOpacity: 0.9,
          });
          path.forEach(extend);
        }

        if (extended) {
          map.fitBounds(bounds, 56);
        } else {
          map.setCenter(center);
          map.setZoom(12);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff, driver, pins, encodedPolyline, hasAnything]);

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 ${className}`}
      >
        {error}
      </div>
    );
  }

  if (!hasAnything) {
    return (
      <div
        className={`rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 ${className}`}
      >
        Map appears when pickup / drop-off / live location coordinates are available.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${heightClass} w-full rounded-2xl border border-gray-200 overflow-hidden ${className}`}
    />
  );
}
