const SCRIPT_ID = "mobilare-google-maps";

type GoogleNamespace = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
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

export function loadGoogleMaps(
  libraries: string[] = ["maps"],
): Promise<GoogleNamespace> {
  const key = googleMapsBrowserKey();
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing"));
  }

  const w = window as Window & { google?: GoogleNamespace };
  if (typeof window !== "undefined" && w.google?.maps) {
    return Promise.resolve(w.google);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as Window & { google: GoogleNamespace }).google));
      existing.addEventListener("error", () => reject(new Error("Maps script failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libraries.join(",")}`;
    script.onload = () =>
      resolve((window as Window & { google: GoogleNamespace }).google);
    script.onerror = () => reject(new Error("Maps script failed"));
    document.head.appendChild(script);
  });
}
