import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WizardHeader, WizardStepper } from "@/components/WizardHeader";
import { BottomNav } from "@/components/BottomNav";
import { saveRoofPlanner } from "@/lib/actions";
import { RoofPlannerCanvas } from "@/components/roof-planner/RoofPlannerCanvas";

export const dynamic = "force-dynamic";

export default async function RoofPlannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { assessment: true } });
  if (!lead || !lead.assessment) notFound();

  const action = saveRoofPlanner.bind(null, lead.id);

  return (
    <div className="font-body-base text-on-surface antialiased">
      <WizardHeader leadCode={lead.leadCode} leadName={lead.customerName} backHref={`/leads/${lead.id}/visit/electrical`} />
      <main className="pt-16 md:pt-16 pb-32 md:pb-8 px-gutter-mobile max-w-5xl mx-auto space-y-6">
        <WizardStepper currentStep={4} />
        <RoofPlannerCanvas
          leadCode={lead.leadCode}
          leadName={lead.customerName}
          action={action}
          initialTotalArea={lead.assessment.totalRoofAreaSqft ?? 1200}
          initialTilt={lead.assessment.proposedPanelTilt ?? 15}
        />
      </main>
      <BottomNav />
    </div>
  );
}
