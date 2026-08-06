"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface ResolvedAddress {
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
  city: string;
  state: string;
  pinCode: string;
}

export function AddressAutocomplete({
  onSelect,
}: {
  onSelect: (address: ResolvedAddress) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSelect(s: Suggestion) {
    setQuery(`${s.mainText}, ${s.secondaryText}`);
    setOpen(false);
    setResolving(true);
    try {
      const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(s.placeId)}`);
      const data = await res.json();
      onSelect({
        formattedAddress: data.formattedAddress ?? "",
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        city: data.city ?? "",
        state: data.state ?? "",
        pinCode: data.pinCode ?? "",
      });
    } finally {
      setResolving(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Icon name="location_on" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Start typing the property address…"
          className="w-full h-touch-target pl-10 pr-10 rounded-lg border border-outline-variant text-body-base focus:outline-none focus:border-l-2 focus:border-l-secondary-fixed-dim focus:border-primary"
        />
        {(loading || resolving) && (
          <Icon name="progress_activity" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline animate-spin text-[18px]" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-1 w-full bg-white border border-border-subtle rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-border-subtle last:border-b-0"
              >
                <div className="text-body-sm font-medium text-on-surface">{s.mainText}</div>
                <div className="text-body-sm text-on-surface-variant">{s.secondaryText}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
