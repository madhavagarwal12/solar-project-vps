// Application-level unions for fields stored as plain strings in SQLite
// (see prisma/schema.prisma header comment).

export const ROLES = ["FIELD_EXECUTIVE", "MANAGER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FIELD_EXECUTIVE: "Field Executive",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

export const LEAD_STATUSES = [
  "NEW",
  "ASSIGNED",
  "VISIT_SCHEDULED",
  "VISIT_IN_PROGRESS",
  "ASSESSMENT_COMPLETE",
  "PROPOSAL_GENERATED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PROPERTY_TYPES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const CONNECTION_TYPES = ["SINGLE_PHASE", "THREE_PHASE"] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const ROOF_TYPES = ["FLAT_RCC", "SLOPED_TILE", "METAL_SHEET", "ASBESTOS", "TERRACE"] as const;
export type RoofType = (typeof ROOF_TYPES)[number];

export const ROOF_CONDITIONS = ["GOOD", "NEEDS_REPAIR", "WEAK"] as const;
export type RoofCondition = (typeof ROOF_CONDITIONS)[number];

export const ORIENTATIONS = ["NORTH", "SOUTH", "EAST", "WEST", "SOUTH_EAST", "SOUTH_WEST"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const SHADING_LEVELS = ["NONE", "PARTIAL", "FULL"] as const;
export type ShadingLevel = (typeof SHADING_LEVELS)[number];

export const OBSTRUCTION_TYPES = [
  { key: "water_tank", label: "Water Tank", icon: "water_drop" },
  { key: "parapet", label: "Parapet Wall", icon: "fence" },
  { key: "overhead_cable", label: "Overhead Cable", icon: "cable" },
  { key: "neighboring_building", label: "Neighboring Building", icon: "apartment" },
  { key: "trees", label: "Trees", icon: "park" },
  { key: "mobile_tower", label: "Mobile Tower / Antenna", icon: "cell_tower" },
] as const;

export const PANEL_WATTAGES = [400, 440, 540, 550, 600] as const;

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  VISIT_SCHEDULED: "Upcoming",
  VISIT_IN_PROGRESS: "In Progress",
  ASSESSMENT_COMPLETE: "Assessment Complete",
  PROPOSAL_GENERATED: "Proposal Ready",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

/** Maps a lead status to the strip/badge color tokens used across the mockups. */
export function statusColor(status: string): "overdue" | "upcoming" | "done" | "neutral" {
  if (status === "VISIT_SCHEDULED" || status === "ASSIGNED") return "upcoming";
  if (status === "WON" || status === "ASSESSMENT_COMPLETE" || status === "PROPOSAL_SENT") return "done";
  if (status === "NEW" || status === "LOST") return "neutral";
  return "neutral";
}
