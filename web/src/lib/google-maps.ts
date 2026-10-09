/* eslint-disable @typescript-eslint/no-explicit-any */
const SCRIPT_ID = "mobilare-google-maps";

export function googleMapsBrowserKey(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

export function loadGoogleMaps(libraries: string[] = ["maps"]): Promise<any> {
  const key = googleMapsBrowserKey();
  if (!key) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing"));
  }

  if (typeof window !== "undefined" && (window as any).google?.maps) {
    return Promise.resolve((window as any).google);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).google));
      existing.addEventListener("error", () => reject(new Error("Maps script failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libraries.join(",")}`;
    script.onload = () => resolve((window as any).google);
    script.onerror = () => reject(new Error("Maps script failed"));
    document.head.appendChild(script);
  });
}
