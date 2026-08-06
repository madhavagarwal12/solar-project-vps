import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";
import { WizardHeader } from "@/components/WizardHeader";

export const dynamic = "force-dynamic";

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assessment: { include: { calculations: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });

  const calculation = lead?.assessment?.calculations[0];
  if (!lead || !calculation) notFound();

  const money = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

  return (
    <div className="font-body-base text-on-surface antialiased bg-slate-surface min-h-screen">
      <WizardHeader leadCode={lead.leadCode} leadName={lead.customerName} backHref={`/leads/${lead.id}/results`} />
      <main className="pt-20 pb-24 px-gutter-mobile max-w-4xl mx-auto space-y-6">
        <section className="bg-primary text-on-primary rounded-xl p-6 md:p-10">
          <p className="text-data-label uppercase tracking-widest text-secondary-container">Solar Proposal</p>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline mt-3">{lead.customerName}</h1>
          <p className="text-body-sm mt-2 text-primary-fixed">{lead.address}, {lead.city}, {lead.state}</p>
          <p className="text-body-sm mt-6 text-primary-fixed">Prepared from site assessment {lead.leadCode}</p>
        </section>

        <section className="bg-white rounded-xl border border-border-subtle p-6">
          <h2 className="text-headline-md font-headline text-primary">Recommended System</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <Stat label="System size" value={`${calculation.systemSizeKw.toFixed(1)} kWp`} />
            <Stat label="Panels" value={`${calculation.panelCount} × ${calculation.panelWattage}W`} />
            <Stat label="Annual generation" value={`${Math.round(calculation.annualGenKwh).toLocaleString("en-IN")} kWh`} />
            <Stat label="Payback" value={`${calculation.paybackYears.toFixed(1)} years`} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-border-subtle p-6">
          <h2 className="text-headline-md font-headline text-primary">Financial Summary</h2>
          <div className="grid grid-cols-2 gap-4 mt-5">
            <Stat label="Gross cost" value={money(calculation.grossCost)} />
            <Stat label="Subsidy" value={money(calculation.subsidyAmount)} />
            <Stat label="Net cost" value={money(calculation.netCost)} />
            <Stat label="Monthly savings" value={money(calculation.monthlySavings)} />
            <Stat label="Annual savings" value={money(calculation.annualSavings)} />
            <Stat label="25-year savings" value={money(calculation.lifetimeSavings25yr)} />
          </div>
        </section>

        <section className="bg-surface-container rounded-xl border border-border-subtle p-6">
          <h2 className="text-headline-md font-headline text-primary">Assessment Notes</h2>
          <p className="text-body-sm text-on-surface-variant mt-3">
            This is a proposal preview generated from the latest saved calculation. Final PDF export, manager approval,
            and customer email delivery will be connected in the proposal workflow phase.
          </p>
        </section>

        <Link
          href={`/leads/${lead.id}/results`}
          className="w-full bg-primary text-on-primary py-4 rounded-xl flex items-center justify-center font-headline text-headline-md"
        >
          Back to Results
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low border border-border-subtle rounded-lg p-4">
      <p className="font-label text-data-label text-outline uppercase">{label}</p>
      <p className="font-semibold text-primary mt-1">{value}</p>
    </div>
  );
}
