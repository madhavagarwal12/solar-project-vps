import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";

// Server-side proxy for Places API (New) Autocomplete — keeps
// GOOGLE_MAPS_SERVER_API_KEY out of the browser. Reached only by
// authenticated sessions: proxy.ts gates every non-/api/auth route.
export async function GET(request: Request) {
  await requireSession();

  const input = new URL(request.url).searchParams.get("input")?.trim();
  if (!input || input.length < 3) return NextResponse.json({ suggestions: [] });

  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Maps not configured" }, { status: 501 });

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({ input, includedRegionCodes: ["in"] }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return NextResponse.json({ suggestions: [] });

  const data = (await res.json()) as {
    suggestions?: {
      placePrediction?: {
        placeId: string;
        text?: { text: string };
        structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
      };
    }[];
  };

  const suggestions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      placeId: p.placeId,
      mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));

  return NextResponse.json({ suggestions });
}
