// PVGIS 5.3 non-interactive API — location-specific solar irradiation.
// Docs: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en
//
// We call PVcalc with a horizontal, non-optimized plane (angle=0, aspect=0) so
// outputs.totals.fixed["H(i)_d"] equals the horizontal-plane average daily
// irradiation — i.e. Peak Sun Hours (kWh/m²/day) — matching the definition our
// calculation engine already expects (orientation/tilt losses are applied
// separately in lib/calculations.ts, so we must not fetch a tilted-plane value
// here or those effects would be double-counted).
import { pshForState } from "./psh-data";

const PVGIS_URL = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";
const FETCH_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { value: number; expiresAt: number }>();

async function fetchPvgisPsh(lat: number, lng: number): Promise<number | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const url = `${PVGIS_URL}?lat=${lat}&lon=${lng}&peakpower=1&loss=0&angle=0&aspect=0&outputformat=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      outputs?: { totals?: { fixed?: Record<string, number> } };
    };
    const value = data.outputs?.totals?.fixed?.["H(i)_d"];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;

    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch {
    return null; // network error, timeout, or malformed response — caller falls back
  }
}

export type PshSource = "PVGIS" | "STATE_AVERAGE";

export interface PshResult {
  pshHours: number;
  source: PshSource;
}

/**
 * Resolves Peak Sun Hours for a lead: PVGIS live data when coordinates are
 * available and the API responds, otherwise the state-level fallback table.
 */
export async function getPshHours(lead: {
  lat: number | null;
  lng: number | null;
  state: string;
}): Promise<PshResult> {
  if (lead.lat != null && lead.lng != null) {
    const pvgisValue = await fetchPvgisPsh(lead.lat, lead.lng);
    if (pvgisValue !== null) {
      return { pshHours: Math.round(pvgisValue * 100) / 100, source: "PVGIS" };
    }
  }
  return { pshHours: pshForState(lead.state), source: "STATE_AVERAGE" };
}
