"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OBSTRUCTION_TYPES } from "@/lib/types";
import {
  calcFinancials,
  calcGeneration,
  calcRoofArea,
  orientationFactor as orientationFactorFor,
  shadingLossPct,
} from "@/lib/calculations";
import { getPshHours } from "@/lib/pvgis";
import type { Orientation, ShadingLevel } from "@/lib/types";

function generateLeadCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const letters = Array.from({ length: 2 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ).join("");
  return `HEL-${digits}-${letters}`;
}

export async function createLead(formData: FormData) {
  const customerName = (formData.get("customerName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();

  if (!customerName || !phone || !address || !city || !state) {
    throw new Error("Customer name, phone, and a resolved address are required.");
  }

  let lead;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      lead = await prisma.lead.create({
        data: {
          leadCode: generateLeadCode(),
          customerName,
          phone,
          altPhone: (formData.get("altPhone") as string) || null,
          email: (formData.get("email") as string) || null,
          address,
          city,
          state,
          pinCode: (formData.get("pinCode") as string) || null,
          lat: num(formData, "lat") ?? null,
          lng: num(formData, "lng") ?? null,
          propertyType: (formData.get("propertyType") as string) || "RESIDENTIAL",
          connectionType: (formData.get("connectionType") as string) || "SINGLE_PHASE",
          sanctionedLoadKw: num(formData, "sanctionedLoadKw"),
          avgMonthlyBill: num(formData, "avgMonthlyBill"),
          avgMonthlyUnits: num(formData, "avgMonthlyUnits"),
          leadSource: (formData.get("leadSource") as string) || null,
          notes: (formData.get("notes") as string) || null,
          status: "NEW",
        },
      });
      break;
    } catch (err) {
      // Retry on the rare leadCode collision; rethrow anything else.
      const isUniqueConflict = (err as { code?: string })?.code === "P2002";
      if (!isUniqueConflict) throw err;
    }
  }
  if (!lead) throw new Error("Could not generate a unique lead code — please retry.");

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

async function getOrCreateAssessment(leadId: string) {
  const existing = await prisma.siteAssessment.findUnique({ where: { leadId } });
  if (existing) return existing;
  return prisma.siteAssessment.create({
    data: { leadId, visitStartedAt: new Date(), status: "VISIT_IN_PROGRESS" },
  });
}

export async function startVisit(leadId: string) {
  await getOrCreateAssessment(leadId);
  await prisma.lead.update({ where: { id: leadId }, data: { status: "VISIT_IN_PROGRESS" } });
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}/visit/property`);
}

function num(formData: FormData, key: string): number | undefined {
  const v = formData.get(key);
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function int(formData: FormData, key: string): number | undefined {
  const n = num(formData, key);
  return n === undefined ? undefined : Math.round(n);
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function savePropertyStep(leadId: string, formData: FormData) {
  const assessment = await getOrCreateAssessment(leadId);
  await prisma.siteAssessment.update({
    where: { id: assessment.id },
    data: {
      roofType: (formData.get("roofType") as string) || null,
      roofCondition: (formData.get("roofCondition") as string) || null,
      totalRoofAreaSqft: num(formData, "totalRoofAreaSqft"),
      usableAreaSqft: num(formData, "usableAreaSqft"),
      floors: int(formData, "floors"),
      buildingAgeYears: int(formData, "buildingAgeYears"),
      roofAccess: (formData.get("roofAccess") as string) || null,
      structurallySound: formData.get("structurallySound")
        ? formData.get("structurallySound") === "yes"
        : undefined,
      hasLeakageOrCracks: formData.get("hasLeakageOrCracks")
        ? formData.get("hasLeakageOrCracks") === "yes"
        : undefined,
      roofOrientation: (formData.get("roofOrientation") as string) || null,
      roofTiltDegrees: num(formData, "roofTiltDegrees"),
      usesMountingStructure: bool(formData, "usesMountingStructure"),
      proposedPanelTilt: num(formData, "proposedPanelTilt"),
    },
  });
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}/visit/shading`);
}

export async function saveShadingStep(leadId: string, formData: FormData) {
  const assessment = await getOrCreateAssessment(leadId);

  await prisma.siteAssessment.update({
    where: { id: assessment.id },
    data: {
      shadingMorning: (formData.get("shadingMorning") as ShadingLevel) || "NONE",
      shadingPeak: (formData.get("shadingPeak") as ShadingLevel) || "NONE",
      shadingEvening: (formData.get("shadingEvening") as ShadingLevel) || "NONE",
    },
  });

  await prisma.siteObstruction.deleteMany({ where: { assessmentId: assessment.id } });
  const rows = OBSTRUCTION_TYPES.filter((o) => formData.get(`obstruction_${o.key}`) === "on").map(
    (o) => ({
      assessmentId: assessment.id,
      type: o.key,
      present: true,
      heightFt: num(formData, `height_${o.key}`) ?? null,
      distanceFt: num(formData, `distance_${o.key}`) ?? null,
    }),
  );
  if (rows.length > 0) {
    await prisma.siteObstruction.createMany({ data: rows });
  }

  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}/visit/electrical`);
}

export async function saveElectricalStep(leadId: string, formData: FormData) {
  const assessment = await getOrCreateAssessment(leadId);
  await prisma.siteAssessment.update({
    where: { id: assessment.id },
    data: {
      meterNumber: (formData.get("meterNumber") as string) || null,
      discomName: (formData.get("discomName") as string) || null,
      meterLocation: (formData.get("meterLocation") as string) || null,
      distanceRoofToMeterM: num(formData, "distanceRoofToMeterM"),
      netMeteringAvailable: formData.get("netMeteringAvailable")
        ? formData.get("netMeteringAvailable") === "yes"
        : undefined,
      hasExistingInverter: bool(formData, "hasExistingInverter"),
      hasExistingSolar: bool(formData, "hasExistingSolar"),
      spaceNearMeter: bool(formData, "spaceNearMeter"),
    },
  });
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}/visit/roof-planner`);
}

export async function saveRoofPlanner(leadId: string, formData: FormData) {
  const assessment = await getOrCreateAssessment(leadId);

  const totalRoofAreaSqft = num(formData, "totalRoofAreaSqft") ?? assessment.totalRoofAreaSqft ?? 0;
  const obstructionAreaSqft = num(formData, "obstructionAreaSqft") ?? 0;
  const panelWattage = int(formData, "panelWattage") ?? 550;

  const { netUsableAreaSqft, maxPanels } = calcRoofArea({
    totalRoofAreaSqft,
    obstructionAreaSqft,
  });

  await prisma.siteAssessment.update({
    where: { id: assessment.id },
    data: {
      totalRoofAreaSqft,
      usableAreaSqft: netUsableAreaSqft,
      status: "ASSESSMENT_COMPLETE",
      visitCompletedAt: new Date(),
    },
  });
  await prisma.lead.update({ where: { id: leadId }, data: { status: "ASSESSMENT_COMPLETE" } });

  redirect(`/leads/${leadId}/results?panels=${maxPanels}&wattage=${panelWattage}`);
}

export async function generateResults(leadId: string, formData: FormData) {
  const assessment = await prisma.siteAssessment.findUnique({ where: { leadId }, include: { lead: true } });
  if (!assessment) throw new Error("Assessment not found for lead");

  const panelCount = int(formData, "panelCount") ?? 10;
  const panelWattage = int(formData, "panelWattage") ?? 550;
  const tariffPerUnit = num(formData, "tariffPerUnit") ?? 8;
  const costPerKw = num(formData, "costPerKw") ?? 55000;

  const systemSizeKw = (panelCount * panelWattage) / 1000;
  const { pshHours: psh, source: pshSource } = await getPshHours(assessment.lead);
  const orientation = (assessment.roofOrientation as Orientation) ?? "SOUTH";
  const peakShading = (assessment.shadingPeak as ShadingLevel) ?? "NONE";
  const shading = shadingLossPct(peakShading);

  const generation = calcGeneration({
    systemSizeKw,
    pshHours: psh,
    orientationFactor: orientationFactorFor(orientation),
    shadingLossPct: shading,
  });

  const financials = calcFinancials({
    systemSizeKw,
    costPerKw,
    tariffPerUnit,
    annualGenKwh: generation.annualGenKwh,
  });

  await prisma.solarCalculation.create({
    data: {
      assessmentId: assessment.id,
      systemSizeKw,
      panelCount,
      panelWattage,
      pshHours: psh,
      pshSource,
      performanceRatio: 0.78,
      orientationFactor: orientationFactorFor(orientation),
      shadingLossPct: shading,
      dustLossPct: 3,
      temperatureLossPct: 5,
      cableInverterLossPct: 4,
      dailyGenKwh: generation.dailyGenKwh,
      monthlyGenKwh: generation.monthlyGenKwh,
      annualGenKwh: generation.annualGenKwh,
      tariffPerUnit,
      costPerKw,
      grossCost: financials.grossCost,
      subsidyAmount: financials.subsidyAmount,
      netCost: financials.netCost,
      monthlySavings: financials.monthlySavings,
      annualSavings: financials.annualSavings,
      paybackYears: financials.paybackYears,
      lifetimeSavings25yr: financials.lifetimeSavings25yr,
      roiPct: financials.roiPct,
      co2OffsetAnnualTons: financials.co2OffsetAnnualTons,
    },
  });

  await prisma.lead.update({ where: { id: leadId }, data: { status: "PROPOSAL_GENERATED" } });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/leads`);
  redirect(`/leads/${leadId}/results`);
}
