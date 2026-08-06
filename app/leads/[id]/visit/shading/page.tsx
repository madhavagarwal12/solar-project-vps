import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WizardHeader, WizardStepper } from "@/components/WizardHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { saveShadingStep } from "@/lib/actions";
import { OBSTRUCTION_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShadingStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assessment: { include: { obstructions: true } } },
  });
  if (!lead) notFound();
  if (!lead.assessment) notFound();

  const a = lead.assessment;
  const action = saveShadingStep.bind(null, lead.id);
  const byType = Object.fromEntries(a.obstructions.map((o) => [o.type, o]));

  return (
    <div className="font-body-base text-on-surface antialiased">
      <WizardHeader leadCode={lead.leadCode} leadName={lead.customerName} backHref={`/leads/${lead.id}/visit/property`} />
      <main className="pt-16 pb-32 px-gutter-mobile max-w-2xl mx-auto space-y-6">
        <WizardStepper currentStep={2} />

        <div className="relative bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
          <p className="text-body-sm text-on-surface-variant leading-relaxed italic">
            Identify obstructions within 30ft of the proposed array location, then record shading through the
            day. Heavy peak-hour shading triggers a micro-inverter recommendation on the results screen.
          </p>
        </div>

        <form action={action} className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="architecture" className="text-energy-orange" />
              <h3 className="font-headline text-headline-md">Nearby Obstructions</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {OBSTRUCTION_TYPES.map((o) => {
                const existing = byType[o.key];
                return (
                  <div
                    key={o.key}
                    className="bg-white border border-border-subtle rounded-xl p-4 border-l-4 border-l-primary-container shadow-sm flex flex-col gap-4"
                  >
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name={`obstruction_${o.key}`}
                          defaultChecked={!!existing}
                          className="w-5 h-5 border-2 border-outline-variant rounded"
                        />
                        <span className="font-semibold text-body-base">{o.label}</span>
                      </div>
                      <Icon name={o.icon} className="text-outline" />
                    </label>
                    <div className="grid grid-cols-2 gap-3 pl-8">
                      <div className="space-y-1">
                        <label className="font-label text-data-label text-on-surface-variant">HEIGHT (FT)</label>
                        <input
                          type="number"
                          step="any"
                          name={`height_${o.key}`}
                          defaultValue={existing?.heightFt ?? undefined}
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
                          placeholder="0.0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-label text-data-label text-on-surface-variant">DISTANCE (FT)</label>
                        <input
                          type="number"
                          step="any"
                          name={`distance_${o.key}`}
                          defaultValue={existing?.distanceFt ?? undefined}
                          className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Icon name="schedule" className="text-energy-orange" />
              <h3 className="font-headline text-headline-md">Time Assessment</h3>
            </div>
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 bg-surface-container-low border-b border-border-subtle">
                <div className="p-3 text-center border-r border-border-subtle font-label text-data-label uppercase">
                  Morning
                </div>
                <div className="p-3 text-center border-r border-border-subtle font-label text-data-label uppercase">
                  Peak
                </div>
                <div className="p-3 text-center font-label text-data-label uppercase">Evening</div>
              </div>
              <div className="grid grid-cols-3">
                <ShadingSelect name="shadingMorning" defaultValue={a.shadingMorning} borderRight />
                <ShadingSelect name="shadingPeak" defaultValue={a.shadingPeak} borderRight />
                <ShadingSelect name="shadingEvening" defaultValue={a.shadingEvening} />
              </div>
            </div>
          </section>

          <div className="pt-8 flex flex-col gap-4">
            <button className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
              CONTINUE TO ELECTRICAL
              <Icon name="chevron_right" />
            </button>
          </div>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}

function ShadingSelect({
  name,
  defaultValue,
  borderRight,
}: {
  name: string;
  defaultValue: string;
  borderRight?: boolean;
}) {
  return (
    <div className={`p-3 ${borderRight ? "border-r border-border-subtle" : ""}`}>
      <select name={name} defaultValue={defaultValue} className="w-full border-none bg-transparent font-semibold text-body-sm focus:ring-0">
        <option value="NONE">None</option>
        <option value="PARTIAL">Partial</option>
        <option value="FULL">Full</option>
      </select>
    </div>
  );
}
