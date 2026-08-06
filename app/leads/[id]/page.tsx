import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { STATUS_LABELS } from "@/lib/types";
import { startVisit } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assessment: { include: { calculations: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });

  if (!lead) notFound();

  const hasAssessment = !!lead.assessment;
  const hasResults = (lead.assessment?.calculations.length ?? 0) > 0;
  const startVisitBound = startVisit.bind(null, lead.id);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lead.address}, ${lead.city}, ${lead.state}`,
  )}`;

  return (
    <div className="min-h-screen flex bg-slate-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <nav className="sticky top-0 z-30 bg-primary text-on-primary flex items-center gap-4 w-full px-gutter-mobile md:px-gutter-desktop h-touch-target md:h-16">
          <Link href="/leads">
            <Icon name="arrow_back" />
          </Link>
          <h1 className="font-headline text-headline-md-mobile md:text-headline-md font-bold">Lead Detail</h1>
        </nav>

        <main className="p-gutter-mobile md:p-gutter-desktop pb-24 md:pb-8 max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-border-subtle rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-headline text-headline-lg-mobile text-primary">{lead.customerName}</h2>
                <p className="text-body-sm text-outline flex items-center gap-1 mt-1">
                  <Icon name="location_on" className="text-[16px]" />
                  {lead.address}, {lead.city}, {lead.state} {lead.pinCode}
                </p>
              </div>
              <span className="font-label text-data-label text-outline uppercase">{lead.leadCode}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border-subtle pt-4 text-body-sm">
              <div>
                <span className="font-label text-data-label text-outline uppercase block">Status</span>
                <span className="font-semibold">
                  {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] ?? lead.status}
                </span>
              </div>
              <div>
                <span className="font-label text-data-label text-outline uppercase block">Property Type</span>
                <span className="font-semibold">{lead.propertyType}</span>
              </div>
              <div>
                <span className="font-label text-data-label text-outline uppercase block">Sanctioned Load</span>
                <span className="font-semibold">{lead.sanctionedLoadKw ?? "—"} kW</span>
              </div>
              <div>
                <span className="font-label text-data-label text-outline uppercase block">Avg. Monthly Bill</span>
                <span className="font-semibold">₹{lead.avgMonthlyBill?.toLocaleString() ?? "—"}</span>
              </div>
            </div>

            {lead.notes && (
              <p className="mt-4 text-body-sm text-on-surface-variant italic border-t border-border-subtle pt-4">
                {lead.notes}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-touch-target border border-primary text-primary rounded-lg font-bold hover:bg-surface-container-low transition-colors"
            >
              <Icon name="navigation" />
              Navigate
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center justify-center gap-2 h-touch-target border border-primary text-primary rounded-lg font-bold hover:bg-surface-container-low transition-colors"
            >
              <Icon name="call" />
              Call Customer
            </a>
          </div>

          {!hasResults ? (
            <form action={startVisitBound}>
              <button className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                {hasAssessment ? "Resume Visit" : "Start Visit"}
                <Icon name="chevron_right" />
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <Link
                href={`/leads/${lead.id}/results`}
                className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                View Calculation Results
                <Icon name="chevron_right" />
              </Link>
              <form action={startVisitBound}>
                <button className="w-full h-touch-target bg-white border border-primary text-primary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all">
                  Re-run Site Visit
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
