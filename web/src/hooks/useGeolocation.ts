"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoPoint = { lat: number; lng: number; accuracy?: number; at: string };

type Options = {
  watch?: boolean;
  enabled?: boolean;
  /** London fallback when permission denied / unavailable */
  fallback?: { lat: number; lng: number };
};

const LONDON = { lat: 51.5074, lng: -0.1278 };

export function useGeolocation(opts: Options = {}) {
  const { watch = false, enabled = true, fallback = LONDON } = opts;
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const watchId = useRef<number | null>(null);

  const apply = useCallback((coords: GeolocationCoordinates) => {
    setPoint({
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      at: new Date().toISOString(),
    });
    setUsingFallback(false);
    setError(null);
  }, []);

  const fail = useCallback(
    (msg: string) => {
      setError(msg);
      setPoint({ ...fallback, at: new Date().toISOString() });
      setUsingFallback(true);
    },
    [fallback],
  );

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      fail("Geolocation unavailable in this browser");
      return;
    }

    const geoOpts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 15_000,
    };

    if (watch) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => apply(pos.coords),
        (err) => fail(err.message || "Location permission denied"),
        geoOpts,
      );
      return () => {
        if (watchId.current != null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => apply(pos.coords),
      (err) => fail(err.message || "Location permission denied"),
      geoOpts,
    );
  }, [enabled, watch, apply, fail]);

  return { point, error, usingFallback };
}
