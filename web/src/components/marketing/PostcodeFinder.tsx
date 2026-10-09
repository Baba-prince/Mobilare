"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AddressSuggestion,
  AddressesLookup,
  lookupPostcode,
  looksLikeUkPostcode,
} from "@/lib/addresses";

type Variant = "hero" | "light";

type Props = {
  variant?: Variant;
  ctaLabel?: string;
  placeholder?: string;
  initialPostcode?: string;
  /** When true, selecting a suggestion navigates to /book with postcode (+ optional address). */
  bookOnSelect?: boolean;
  className?: string;
};

export function PostcodeFinder({
  variant = "hero",
  ctaLabel = "Find address",
  placeholder = "Enter UK postcode e.g. SW1A 1AA",
  initialPostcode = "",
  bookOnSelect = true,
  className = "",
}: Props) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AddressesLookup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function runLookup(raw: string) {
    const q = raw.trim();
    if (!q) {
      setError("Enter a UK postcode");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await lookupPostcode(q);
      setResult(data);
      setPostcode(data.postcode || q.toUpperCase());
      setOpen(true);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Lookup failed");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runLookup(postcode);
  }

  function goBook(suggestion?: AddressSuggestion) {
    const pc = (suggestion?.postcode || result?.postcode || postcode).trim();
    if (!pc) {
      router.push("/book");
      return;
    }
    const params = new URLSearchParams({ postcode: pc });
    if (suggestion?.label) params.set("address", suggestion.label);
    if (suggestion?.line1) params.set("line1", suggestion.line1);
    router.push(`/book?${params.toString()}`);
  }

  const inputClass =
    variant === "hero"
      ? "flex-1 px-5 py-3 rounded-full bg-white text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal font-light"
      : "input-field rounded-full";

  const meta =
    result &&
    [result.admin_district, result.region, result.postcode].filter(Boolean).join(" · ");

  return (
    <div ref={wrapRef} className={`relative w-full max-w-xl ${className}`}>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          name="postcode"
          autoComplete="postal-code"
          spellCheck={false}
          placeholder={placeholder}
          value={postcode}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          onChange={(e) => {
            setPostcode(e.target.value.toUpperCase());
            setError(null);
          }}
          onBlur={() => {
            const q = postcode.trim();
            if (q && looksLikeUkPostcode(q) && !result) void runLookup(q);
          }}
          className={inputClass}
        />
        <button type="submit" className="btn-primary shadow-xl shadow-teal/40" disabled={loading}>
          {loading ? "Searching…" : ctaLabel}
        </button>
      </form>

      {error ? (
        <p className={`mt-2 text-sm ${variant === "hero" ? "text-red-300" : "text-red-600"}`}>
          {error}
        </p>
      ) : null}

      {open && result ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white text-charcoal shadow-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">
              Coverage confirmed
            </p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{meta}</p>
            {result.provider ? (
              <p className="text-[11px] text-gray-500 mt-1">via {result.provider}</p>
            ) : null}
          </div>
          <ul className="max-h-64 overflow-auto">
            {(result.suggestions || []).slice(0, 8).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  className="w-full text-left px-4 py-3 hover:bg-teal/5 transition border-b border-gray-50 last:border-0"
                  onClick={() => {
                    setPostcode(s.postcode || postcode);
                    setOpen(false);
                    if (bookOnSelect) goBook(s);
                  }}
                >
                  <span className="block text-sm font-semibold text-gray-900">
                    {s.line1 || s.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {s.line2 || s.label}
                  </span>
                </button>
              </li>
            ))}
            {!(result.suggestions || []).length ? (
              <li className="px-4 py-3 text-sm text-gray-600">
                Postcode valid — no street matches. Continue to book with this postcode.
              </li>
            ) : null}
          </ul>
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-sm px-4 py-2"
              onClick={() => goBook()}
            >
              Book with {result.postcode}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm px-4 py-2"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
