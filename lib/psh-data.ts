// Average Peak Sun Hours (PSH) per day, by Indian state.
// Source: solar_field_software_spec.md §6.2 (regional PSH bands). Values below are the
// midpoint of each band; swap for a district-level PVGIS/NREL lookup post-MVP.

export const PSH_BY_STATE: Record<string, number> = {
  Rajasthan: 6.25,
  Gujarat: 6.25,
  Maharashtra: 5.75,
  Telangana: 5.75,
  Karnataka: 5.25,
  "Tamil Nadu": 5.25,
  "Uttar Pradesh": 5.15,
  Delhi: 5.15,
  Punjab: 5.15,
  "West Bengal": 4.75,
  Odisha: 4.75,
  Assam: 4.0,
  Manipur: 4.0,
};

export const DEFAULT_PSH = 5.0;

export function pshForState(state: string): number {
  return PSH_BY_STATE[state] ?? DEFAULT_PSH;
}
