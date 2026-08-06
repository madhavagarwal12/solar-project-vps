import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WizardHeader } from "@/components/WizardHeader";
import { BottomNav } from "@/components/BottomNav";
import { ResultsConfigurator } from "@/components/results/ResultsConfigurator";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { orientationFactor, shadingLossPct, shadingWarning } from "@/lib/calculations";
import { getPshHours } from "@/lib/pvgis";
import type { Orientation, ShadingLevel } from "@/lib/types";
import { generateResults } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ panels?: string; wattage?: string; recalculate?: string }>;
}) {
  const { id } = await params;
  const { panels, wattage, recalculate } = await searchParams;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assessment: { include: { calculations: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  if (!lead || !lead.assessment) notFound();

  const assessment = lead.assessment;
  const existingCalc = assessment.calculations[0] ?? null;

  if (existingCalc && recalculate !== "1") {
    return (
      <Shell lead={lead}>
        <ResultsSummary calc={existingCalc} leadId={lead.id} customerName={lead.customerName} />
      </Shell>
    );
  }

  const orientation = (assessment.roofOrientation as Orientation) ?? "SOUTH";
  const peakShading = (assessment.shadingPeak as ShadingLevel) ?? "NONE";
  const { pshHours: psh, source: pshSource } = await getPshHours(lead);
  const defaultTariff =
    lead.avgMonthlyBill && lead.avgMonthlyUnits ? lead.avgMonthlyBill / lead.avgMonthlyUnits : 8;
  const recommendedPanels = panels ? Number(panels) : 12;
  const panelWattage = wattage ? Number(wattage) : 550;

  const action = generateResults.bind(null, lead.id);

  return (
    <Shell lead={lead}>
      <ResultsConfigurator
        action={action}
        orientationFactorValue={orientationFactor(orientation)}
        shadingLossPctValue={shadingLossPct(peakShading)}
        shadingWarningText={shadingWarning(peakShading)}
        pshHours={psh}
        pshSource={pshSource}
        recommendedPanelCount={recommendedPanels}
        panelWattage={panelWattage}
        defaultTariff={Math.round(defaultTariff * 10) / 10}
        customerName={lead.customerName}
      />
    </Shell>
  );
}

function Shell({
  lead,
  children,
}: {
  lead: { leadCode: string; customerName: string; id: string };
  children: React.ReactNode;
}) {
  return (
    <div className="font-body-base text-on-surface antialiased bg-slate-surface min-h-screen">
      <WizardHeader leadCode={lead.leadCode} leadName={lead.customerName} backHref={`/leads/${lead.id}/visit/roof-planner`} />
      <main className="pt-20 pb-24 px-gutter-mobile max-w-4xl mx-auto space-y-6">{children}</main>
      <BottomNav />
    </div>
  );
}
