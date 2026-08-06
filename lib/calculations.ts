// Calculation engine implementing solar_field_software_spec.md §5 (Roof & Shading Analysis)
// and §6 (Solar Generation Calculator + Financial Summary).

import type { Orientation, ShadingLevel } from "./types";

/** Standard panel footprint assumed for a 550W panel (spec §5.1). */
export const PANEL_LENGTH_FT = 6.5;
export const PANEL_WIDTH_FT = 3.5;
export const PANEL_AREA_SQFT = PANEL_LENGTH_FT * PANEL_WIDTH_FT; // 22.75 sqft

const DEG_TO_RAD = Math.PI / 180;

export interface RoofAreaInput {
  totalRoofAreaSqft: number;
  obstructionAreaSqft: number;
  edgeClearanceFt?: number;
  perimeterFt?: number; // used to derive edge clearance loss when provided
}

export interface RoofAreaResult {
  netUsableAreaSqft: number;
  maxPanels: number;
}

/** §5.1 Roof Area Calculator. */
export function calcRoofArea({
  totalRoofAreaSqft,
  obstructionAreaSqft,
  edgeClearanceFt = 1,
  perimeterFt = 0,
}: RoofAreaInput): RoofAreaResult {
  const edgeLoss = perimeterFt * edgeClearanceFt;
  const netUsableAreaSqft = Math.max(0, totalRoofAreaSqft - obstructionAreaSqft - edgeLoss);
  const maxPanels = Math.floor(netUsableAreaSqft / PANEL_AREA_SQFT);
  return { netUsableAreaSqft, maxPanels };
}

export interface RowSpacingInput {
  panelTiltDegrees: number;
  panelLengthMm: number;
  latitudeDegrees: number;
}

export interface RowSpacingResult {
  minRowSpacingM: number;
  sunElevationWinterSolsticeDeg: number;
}

/**
 * §5.2 Row Spacing Calculator.
 * MinRowSpacing = PanelHeight * sin(tilt) / tan(sun elevation at winter solstice)
 * Winter solstice noon solar elevation ≈ 90 - latitude - 23.45 (northern hemisphere).
 */
export function calcRowSpacing({
  panelTiltDegrees,
  panelLengthMm,
  latitudeDegrees,
}: RowSpacingInput): RowSpacingResult {
  const sunElevationWinterSolsticeDeg = Math.max(1, 90 - latitudeDegrees - 23.45);
  const panelHeightM = (panelLengthMm / 1000) * Math.sin(panelTiltDegrees * DEG_TO_RAD);
  const minRowSpacingM =
    panelHeightM / Math.tan(sunElevationWinterSolsticeDeg * DEG_TO_RAD);
  return { minRowSpacingM, sunElevationWinterSolsticeDeg };
}

/**
 * §5.3 Shading Loss Estimation — driven off the peak-hours shading level captured
 * during the visit (the spec's four-tier table collapses cleanly onto our
 * None/Partial/Full field: Partial covers the Minor–Moderate band, Full the Heavy band).
 */
export function shadingLossPct(peakShading: ShadingLevel): number {
  switch (peakShading) {
    case "NONE":
      return 0;
    case "PARTIAL":
      return 14; // midpoint of Minor(3-7%)/Moderate(10-18%) band
    case "FULL":
      return 27; // midpoint of Heavy (20-35%) band
    default:
      return 0;
  }
}

export function shadingWarning(peakShading: ShadingLevel): string | null {
  if (peakShading === "FULL") {
    return "Heavy shading detected — recommend micro-inverters or DC optimizers.";
  }
  return null;
}

const ORIENTATION_FACTORS: Record<Orientation, number> = {
  SOUTH: 1.0,
  SOUTH_EAST: 0.95,
  SOUTH_WEST: 0.95,
  EAST: 0.85,
  WEST: 0.85,
  NORTH: 0.7,
};

export function orientationFactor(orientation: Orientation): number {
  return ORIENTATION_FACTORS[orientation];
}

export const DEFAULT_PERFORMANCE_RATIO = 0.78;
export const DEFAULT_DUST_LOSS_PCT = 3;
export const DEFAULT_TEMPERATURE_LOSS_PCT = 5;
export const DEFAULT_CABLE_INVERTER_LOSS_PCT = 4;

export interface GenerationInput {
  systemSizeKw: number;
  pshHours: number;
  performanceRatio?: number;
  orientationFactor: number;
  shadingLossPct: number;
  dustLossPct?: number;
  temperatureLossPct?: number;
  cableInverterLossPct?: number;
}

export interface GenerationResult {
  dailyGenKwh: number;
  monthlyGenKwh: number;
  annualGenKwh: number;
}

/** §6.3 Generation Formula with the four adjustment factors from §6.3. */
export function calcGeneration({
  systemSizeKw,
  pshHours,
  performanceRatio = DEFAULT_PERFORMANCE_RATIO,
  orientationFactor,
  shadingLossPct,
  dustLossPct = DEFAULT_DUST_LOSS_PCT,
  temperatureLossPct = DEFAULT_TEMPERATURE_LOSS_PCT,
  cableInverterLossPct = DEFAULT_CABLE_INVERTER_LOSS_PCT,
}: GenerationInput): GenerationResult {
  const base = systemSizeKw * pshHours * performanceRatio * orientationFactor;
  const lossMultiplier =
    (1 - shadingLossPct / 100) *
    (1 - dustLossPct / 100) *
    (1 - temperatureLossPct / 100) *
    (1 - cableInverterLossPct / 100);
  const dailyGenKwh = base * lossMultiplier;
  return {
    dailyGenKwh,
    monthlyGenKwh: dailyGenKwh * 30,
    annualGenKwh: dailyGenKwh * 365,
  };
}

/** §6.5 PM Surya Ghar subsidy — tiered per kW. */
export function calcSubsidy(systemSizeKw: number): number {
  if (systemSizeKw <= 0) return 0;
  const tier1Kw = Math.min(systemSizeKw, 2);
  const tier2Kw = Math.max(0, Math.min(systemSizeKw, 3) - 2);
  return tier1Kw * 30000 + tier2Kw * 18000;
}

export interface FinancialInput {
  systemSizeKw: number;
  costPerKw: number;
  tariffPerUnit: number;
  annualGenKwh: number;
}

export interface FinancialResult {
  grossCost: number;
  subsidyAmount: number;
  netCost: number;
  monthlySavings: number;
  annualSavings: number;
  paybackYears: number;
  lifetimeSavings25yr: number;
  roiPct: number;
  co2OffsetAnnualTons: number;
}

/** India grid average emission factor, kg CO2 per kWh (CEA baseline, approx.). */
const GRID_EMISSION_FACTOR_KG_PER_KWH = 0.82;

/** §6.5 Financial Summary. */
export function calcFinancials({
  systemSizeKw,
  costPerKw,
  tariffPerUnit,
  annualGenKwh,
}: FinancialInput): FinancialResult {
  const grossCost = systemSizeKw * costPerKw;
  const subsidyAmount = calcSubsidy(systemSizeKw);
  const netCost = Math.max(0, grossCost - subsidyAmount);
  const annualSavings = annualGenKwh * tariffPerUnit;
  const monthlySavings = annualSavings / 12;
  const paybackYears = annualSavings > 0 ? netCost / annualSavings : Infinity;
  const lifetimeSavings25yr = annualSavings * 25;
  const roiPct = netCost > 0 ? ((lifetimeSavings25yr - netCost) / netCost) * 100 : 0;
  const co2OffsetAnnualTons = (annualGenKwh * GRID_EMISSION_FACTOR_KG_PER_KWH) / 1000;

  return {
    grossCost,
    subsidyAmount,
    netCost,
    monthlySavings,
    annualSavings,
    paybackYears,
    lifetimeSavings25yr,
    roiPct,
    co2OffsetAnnualTons,
  };
}

/** Seasonal generation curve as a fraction of the annual daily average, Jan-Dec (Indian climate). */
export const MONTHLY_GENERATION_FACTORS = [
  0.85, 0.9, 1.0, 1.08, 1.1, 0.82, 0.75, 0.8, 1.0, 1.05, 0.98, 0.88,
];

export function monthlyGenerationSeries(dailyGenKwh: number): number[] {
  return MONTHLY_GENERATION_FACTORS.map((f) => Math.round(dailyGenKwh * f * 30 * 10) / 10);
}
