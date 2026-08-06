import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WizardHeader, WizardStepper } from "@/components/WizardHeader";
import { BottomNav } from "@/components/BottomNav";
import { savePropertyStep } from "@/lib/actions";
import { ORIENTATIONS, ROOF_CONDITIONS, ROOF_TYPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PropertyStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id }, include: { assessment: true } });
  if (!lead) notFound();

  const a = lead.assessment;
  const action = savePropertyStep.bind(null, lead.id);

  return (
    <div className="font-body-base text-on-surface antialiased">
      <WizardHeader leadCode={lead.leadCode} leadName={lead.customerName} backHref={`/leads/${lead.id}`} />
      <main className="pt-16 pb-32 px-gutter-mobile max-w-2xl mx-auto space-y-6">
        <WizardStepper currentStep={1} />

        <form action={action} className="space-y-6">
          <Section title="Roof Information" icon="roofing">
            <SelectField name="roofType" label="Roof Type" defaultValue={a?.roofType ?? ""}>
              {ROOF_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </SelectField>
            <SelectField name="roofCondition" label="Roof Condition" defaultValue={a?.roofCondition ?? ""}>
              {ROOF_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </SelectField>
            <NumberField
              name="totalRoofAreaSqft"
              label="Total Roof Area (sq ft)"
              defaultValue={a?.totalRoofAreaSqft ?? undefined}
            />
            <NumberField
              name="usableAreaSqft"
              label="Shadow-Free Usable Area (sq ft)"
              defaultValue={a?.usableAreaSqft ?? undefined}
            />
            <NumberField name="floors" label="Number of Floors" defaultValue={a?.floors ?? undefined} />
            <NumberField
              name="buildingAgeYears"
              label="Age of Building (years)"
              defaultValue={a?.buildingAgeYears ?? undefined}
            />
            <SelectField name="roofAccess" label="Roof Access" defaultValue={a?.roofAccess ?? ""}>
              <option value="Easy">Easy</option>
              <option value="Requires ladder">Requires ladder</option>
              <option value="Restricted">Restricted</option>
            </SelectField>
          </Section>

          <Section title="Structural Suitability" icon="foundation">
            <YesNoField
              name="structurallySound"
              label="Roof strong enough for panel weight?"
              defaultValue={a?.structurallySound}
            />
            <YesNoField
              name="hasLeakageOrCracks"
              label="Any major water leakage or cracks?"
              defaultValue={a?.hasLeakageOrCracks}
            />
          </Section>

          <Section title="Orientation & Tilt" icon="explore">
            <SelectField name="roofOrientation" label="Roof Orientation" defaultValue={a?.roofOrientation ?? "SOUTH"}>
              {ORIENTATIONS.map((o) => (
                <option key={o} value={o}>
                  {o.replace(/_/g, "-")}
                </option>
              ))}
            </SelectField>
            <NumberField
              name="roofTiltDegrees"
              label="Roof Tilt (degrees)"
              defaultValue={a?.roofTiltDegrees ?? 0}
            />
            <label className="flex items-center justify-between p-3 bg-white border border-border-subtle rounded-lg">
              <span className="text-body-sm">Will mounting structures be used?</span>
              <input
                type="checkbox"
                name="usesMountingStructure"
                defaultChecked={a?.usesMountingStructure ?? true}
                className="w-5 h-5"
              />
            </label>
            <NumberField
              name="proposedPanelTilt"
              label="Proposed Panel Tilt (degrees)"
              defaultValue={a?.proposedPanelTilt ?? 15}
            />
          </Section>

          <div className="pt-4 flex flex-col gap-4">
            <button className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
              CONTINUE TO SHADING
            </button>
          </div>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-energy-orange">{icon}</span>
        <h3 className="font-headline text-headline-md">{title}</h3>
      </div>
      <div className="bg-white border border-border-subtle rounded-xl p-4 space-y-4 shadow-sm">{children}</div>
    </section>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="font-label text-data-label text-on-surface-variant block uppercase">{label}</label>
      <input
        type="number"
        step="any"
        name={name}
        defaultValue={defaultValue}
        className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
        placeholder="0"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="font-label text-data-label text-on-surface-variant block uppercase">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded text-body-sm font-semibold"
      >
        <option value="">Select...</option>
        {children}
      </select>
    </div>
  );
}

function YesNoField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-border-subtle rounded-lg">
      <span className="text-body-sm">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue === true ? "yes" : defaultValue === false ? "no" : ""}
        className="border-none bg-transparent font-semibold text-body-sm focus:ring-0"
      >
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
  );
}
