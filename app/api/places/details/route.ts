import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";

// Server-side proxy for Places API (New) Place Details — see autocomplete/route.ts
// for why this stays server-side rather than calling Google directly from the browser.
export async function GET(request: Request) {
  await requireSession();

  const placeId = new URL(request.url).searchParams.get("placeId")?.trim();
  if (!placeId) return NextResponse.json({ error: "Missing placeId" }, { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Maps not configured" }, { status: 501 });

  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "formattedAddress,location,addressComponents",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return NextResponse.json({ error: "Lookup failed" }, { status: 502 });

  const data = (await res.json()) as {
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    addressComponents?: { longText: string; types: string[] }[];
  };

  const componentByType = (type: string) =>
    data.addressComponents?.find((c) => c.types.includes(type))?.longText ?? "";

  return NextResponse.json({
    formattedAddress: data.formattedAddress ?? "",
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
    city: componentByType("locality") || componentByType("administrative_area_level_3"),
    state: componentByType("administrative_area_level_1"),
    pinCode: componentByType("postal_code"),
  });
}
