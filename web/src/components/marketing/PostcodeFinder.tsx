"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AddressSuggestion,
  AddressesLookup,
  autocompletePostcodes,
  lookupPostcode,
  looksLikeUkPostcode,
} from "@/lib/addresses";

type Variant = "hero" | "light";

type Props = {
  variant?: Variant;
  ctaLabel?: string;
  placeholder?: string;
  initialPostcode?: string;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AddressesLookup | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"typing" | "full">("typing");

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function runAutocomplete(raw: string) {
    const compact = raw.replace(/\s+/g, "");
    if (compact.length < 2) {
      setLiveSuggestions([]);
      setOpen(false);
      return;
    }
    // Full postcode → full address lookup
    if (looksLikeUkPostcode(raw) && compact.length >= 5 && /[A-Z]{2}$/i.test(compact)) {
      setLoading(true);
      setError(null);
      try {
        const data = await lookupPostcode(raw);
        setResult(data);
        setLiveSuggestions(data.suggestions || []);
        setMode("full");
        setOpen(true);
        if (data.postcode) setPostcode(data.postcode);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lookup failed");
        setOpen(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const list = await autocompletePostcodes(raw);
      setLiveSuggestions(list);
      setResult(null);
      setMode("typing");
      setOpen(list.length > 0);
    } catch {
      setLiveSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function onTyped(value: string) {
    const next = value.toUpperCase();
    setPostcode(next);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runAutocomplete(next);
    }, 280);
  }

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
      setLiveSuggestions(data.suggestions || []);
      setPostcode(data.postcode || q.toUpperCase());
      setMode("full");
      setOpen(true);
    } catch (e) {
      setResult(null);
      setLiveSuggestions([]);
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
    if (suggestion?.label && mode === "full") params.set("address", suggestion.label);
    if (suggestion?.line1 && mode === "full") params.set("line1", suggestion.line1);
    router.push(`/book?${params.toString()}`);
  }

  function pickSuggestion(s: AddressSuggestion) {
    setPostcode(s.postcode || postcode);
    setOpen(false);
    if (mode === "typing") {
      // Selected a postcode from autocomplete — expand to addresses then optionally book
      void (async () => {
        await runLookup(s.postcode);
      })();
      return;
    }
    if (bookOnSelect) goBook(s);
  }

  const inputClass =
    variant === "hero"
      ? "flex-1 px-5 py-3 rounded-full bg-white text-charcoal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal font-light"
      : "input-field rounded-full";

  const meta =
    result &&
    [result.admin_district, result.region, result.postcode].filter(Boolean).join(" · ");

  const showList = open && liveSuggestions.length > 0;

  return (
    <div ref={wrapRef} className={`relative w-full max-w-xl ${className}`}>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          name="postcode"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={postcode}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showList}
          role="combobox"
          onChange={(e) => onTyped(e.target.value)}
          onFocus={() => {
            if (liveSuggestions.length) setOpen(true);
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

      {showList ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white text-charcoal shadow-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">
              {mode === "typing" ? "Postcode suggestions" : "Coverage confirmed"}
            </p>
            {mode === "full" && meta ? (
              <p className="text-sm font-medium text-gray-900 mt-0.5">{meta}</p>
            ) : (
              <p className="text-sm text-gray-600 mt-0.5">
                Keep typing or pick a match — e.g. OL8…
              </p>
            )}
          </div>
          <ul className="max-h-64 overflow-auto">
            {liveSuggestions.slice(0, 8).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="w-full text-left px-4 py-3 hover:bg-teal/5 transition border-b border-gray-50 last:border-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(s)}
                >
                  <span className="block text-sm font-semibold text-gray-900">
                    {s.line1 || s.postcode || s.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {s.line2 || s.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {mode === "full" && result ? (
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
