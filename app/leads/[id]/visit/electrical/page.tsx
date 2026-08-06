import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WizardHeader, WizardStepper } from "@/components/WizardHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { saveElectricalStep } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ElectricalStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { assessment: true } });
  if (!lead || !lead.assessment) notFound();

  const a = lead.assessment;
  const action = saveElectricalStep.bind(null, lead.id);

  return (
    <div className="font-body-base text-on-surface antialiased">
      <WizardHeader leadCode={lead.leadCode} leadName={lead.customerName} backHref={`/leads/${lead.id}/visit/shading`} />
      <main className="pt-16 pb-32 px-gutter-mobile max-w-2xl mx-auto space-y-6">
        <WizardStepper currentStep={3} />

        <form action={action} className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="bolt" className="text-energy-orange" />
              <h3 className="font-headline text-headline-md">Meter & Supply</h3>
            </div>
            <div className="bg-white border border-border-subtle rounded-xl p-4 space-y-4 shadow-sm">
              <Field label="Existing Meter Number" name="meterNumber" defaultValue={a.meterNumber ?? ""} />
              <Field label="DISCOM Name" name="discomName" defaultValue={a.discomName ?? ""} placeholder="e.g. MSEDCL, BESCOM, TPDDL" />
              <div className="space-y-1">
                <label className="font-label text-data-label text-on-surface-variant block uppercase">
                  Meter Location
                </label>
                <select
                  name="meterLocation"
                  defaultValue={a.meterLocation ?? ""}
                  className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded text-body-sm font-semibold"
                >
                  <option value="">Select...</option>
                  <option value="Inside">Inside</option>
                  <option value="Outside">Outside</option>
                </select>
              </div>
              <Field
                label="Distance Roof to Meter (m)"
                name="distanceRoofToMeterM"
                type="number"
                defaultValue={a.distanceRoofToMeterM ?? ""}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon name="checklist" className="text-energy-orange" />
              <h3 className="font-headline text-headline-md">Site Checklist</h3>
            </div>
            <div className="bg-white border border-border-subtle rounded-xl p-4 space-y-3 shadow-sm">
              <YesNo label="Is net metering available in this area?" name="netMeteringAvailable" defaultValue={a.netMeteringAvailable} />
              <Toggle label="Existing inverter or DG set on site" name="hasExistingInverter" defaultChecked={!!a.hasExistingInverter} />
              <Toggle label="Any existing solar installation" name="hasExistingSolar" defaultChecked={!!a.hasExistingSolar} />
              <Toggle label="Panel space near meter for new junction box" name="spaceNearMeter" defaultChecked={!!a.spaceNearMeter} />
            </div>
          </section>

          <div className="pt-4 flex flex-col gap-4">
            <button className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
              CONTINUE TO ROOF PLANNER
              <Icon name="chevron_right" />
            </button>
          </div>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="font-label text-data-label text-on-surface-variant block uppercase">{label}</label>
      <input
        type={type}
        step={type === "number" ? "any" : undefined}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
      />
    </div>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between p-2">
      <span className="text-body-sm">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-5 h-5" />
    </label>
  );
}

function YesNo({ label, name, defaultValue }: { label: string; name: string; defaultValue: boolean | null }) {
  return (
    <div className="flex items-center justify-between p-2">
      <span className="text-body-sm">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue === true ? "yes" : defaultValue === false ? "no" : ""}
        className="border-none bg-transparent font-semibold text-body-sm focus:ring-0"
      >
        <option value="">Unknown</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}
