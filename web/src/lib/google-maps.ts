const SCRIPT_ID = "mobilare-google-maps";

export type GoogleMapsApi = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
      fitBounds: (bounds: unknown, padding?: number) => void;
    };
    Marker: new (opts: Record<string, unknown>) => unknown;
    LatLngBounds: new () => {
      extend: (p: { lat: number; lng: number }) => void;
    };
    Polyline: new (opts: Record<string, unknown>) => unknown;
  };
};

export function googleMapsBrowserKey(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

function readGoogle(): GoogleMapsApi | undefined {
  return (window as unknown as { google?: GoogleMapsApi }).google;
}

export function loadGoogleMaps(
  libraries: string[] = ["maps"],
): Promise<GoogleMapsApi> {
  const key = googleMapsBrowserKey();
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing"));
  }

  const existingApi = typeof window !== "undefined" ? readGoogle() : undefined;
  if (existingApi?.maps) return Promise.resolve(existingApi);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const done = () => {
      const api = readGoogle();
      if (api?.maps) resolve(api);
      else reject(new Error("Google Maps failed to initialize"));
    };
    if (existing) {
      existing.addEventListener("load", done);
      existing.addEventListener("error", () => reject(new Error("Maps script failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libraries.join(",")}`;
    script.onload = done;
    script.onerror = () => reject(new Error("Maps script failed"));
    document.head.appendChild(script);
  });
}
