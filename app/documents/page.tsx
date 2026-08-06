import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { STATUS_LABELS, type LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const leads = await prisma.lead.findMany({
    where: {
      assessment: {
        calculations: {
          some: {},
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      assessment: {
        include: {
          calculations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const proposalDocuments = leads.flatMap((lead) => {
    const calculation = lead.assessment?.calculations[0];
    if (!calculation) return [];

    return [
      {
        id: calculation.id,
        leadId: lead.id,
        leadCode: lead.leadCode,
        customerName: lead.customerName,
        city: lead.city,
        state: lead.state,
        status: lead.status,
        systemSizeKw: calculation.systemSizeKw,
        netCost: calculation.netCost,
        createdAt: calculation.createdAt,
      },
    ];
  });

  const otherDocuments = leads.map((lead) => ({
    id: lead.id,
    leadId: lead.id,
    leadCode: lead.leadCode,
    customerName: lead.customerName,
    city: lead.city,
    state: lead.state,
    updatedAt: lead.assessment?.updatedAt ?? lead.updatedAt,
  }));

  return (
    <div className="min-h-screen flex bg-slate-surface">
      <Sidebar />
      <main className="flex-1 p-gutter-mobile md:p-gutter-desktop pb-24 md:pb-8 max-w-6xl mx-auto w-full space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-label text-data-label uppercase text-outline">Document Center</p>
            <h1 className="font-headline text-headline-lg-mobile md:text-headline-lg text-primary">
              Proposals & Documents
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 md:w-80">
            <SummaryCard label="Proposals" value={proposalDocuments.length} icon="description" />
            <SummaryCard label="Site files" value={otherDocuments.length} icon="folder" />
          </div>
        </header>

        <section className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="border-b border-border-subtle px-4 md:px-6 pt-4">
            <div className="flex gap-2 overflow-x-auto">
              <a href="#proposals" className="px-4 py-3 rounded-t-lg bg-secondary-container text-on-secondary-container font-label text-data-label uppercase whitespace-nowrap">
                All Proposals
              </a>
              <a href="#documents" className="px-4 py-3 rounded-t-lg text-on-surface-variant hover:bg-surface-container-high font-label text-data-label uppercase whitespace-nowrap">
                Other Documents
              </a>
            </div>
          </div>

          <div id="proposals" className="p-4 md:p-6 space-y-4">
            <SectionHeader title="All Proposals" subtitle="Generated proposal previews from saved solar calculations." />
            {proposalDocuments.length > 0 ? (
              <div className="grid gap-3">
                {proposalDocuments.map((proposal) => (
                  <DocumentRow
                    key={proposal.id}
                    icon="description"
                    title={`${proposal.customerName} proposal`}
                    meta={`${proposal.leadCode} - ${proposal.city}, ${proposal.state}`}
                    detail={`${proposal.systemSizeKw.toFixed(1)} kWp - Rs ${Math.round(proposal.netCost).toLocaleString("en-IN")} net cost`}
                    badge={STATUS_LABELS[proposal.status as LeadStatus] ?? proposal.status}
                    date={proposal.createdAt}
                    href={`/leads/${proposal.leadId}/proposal`}
                    actionLabel="View"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="description"
                title="No proposals yet"
                text="Generate results for a lead and its proposal will appear here."
                href="/leads"
                actionLabel="Open Leads"
              />
            )}
          </div>

          <div id="documents" className="border-t border-border-subtle p-4 md:p-6 space-y-4">
            <SectionHeader title="Other Documents" subtitle="Site assessment records available in this local build." />
            {otherDocuments.length > 0 ? (
              <div className="grid gap-3">
                {otherDocuments.map((document) => (
                  <DocumentRow
                    key={document.id}
                    icon="fact_check"
                    title={`${document.customerName} site assessment`}
                    meta={`${document.leadCode} - ${document.city}, ${document.state}`}
                    detail="Visit data and assessment notes"
                    badge="Assessment"
                    date={document.updatedAt}
                    href={`/leads/${document.leadId}`}
                    actionLabel="Open"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="folder"
                title="No site documents yet"
                text="Complete a site assessment to collect documents here."
                href="/leads"
                actionLabel="Open Leads"
              />
            )}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white border border-border-subtle rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="font-label text-data-label text-outline uppercase">{label}</p>
        <Icon name={icon} className="text-[18px] text-primary" />
      </div>
      <p className="font-headline text-headline-md text-primary mt-2">{String(value).padStart(2, "0")}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-headline text-headline-md text-primary">{title}</h2>
      <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>
    </div>
  );
}

function DocumentRow({
  icon,
  title,
  meta,
  detail,
  badge,
  date,
  href,
  actionLabel,
}: {
  icon: string;
  title: string;
  meta: string;
  detail: string;
  badge: string;
  date: Date;
  href: string;
  actionLabel: string;
}) {
  return (
    <article className="border border-border-subtle rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
        <Icon name={icon} filled />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-on-surface truncate">{title}</h3>
          <span className="font-label text-data-label uppercase text-outline border border-border-subtle rounded-full px-2 py-0.5">
            {badge}
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant mt-1">{meta}</p>
        <p className="text-body-sm text-primary mt-1">{detail}</p>
      </div>
      <div className="flex md:flex-col items-center md:items-end justify-between gap-3">
        <time className="text-body-sm text-outline">{date.toLocaleDateString("en-IN")}</time>
        <Link href={href} className="bg-primary text-on-primary rounded-lg px-4 py-2 font-label text-data-label uppercase">
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  text,
  href,
  actionLabel,
}: {
  icon: string;
  title: string;
  text: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="border border-dashed border-border-subtle rounded-lg p-8 text-center">
      <Icon name={icon} className="text-4xl text-outline" />
      <h3 className="font-headline text-headline-md text-primary mt-3">{title}</h3>
      <p className="text-body-sm text-on-surface-variant mt-1">{text}</p>
      <Link href={href} className="inline-flex mt-4 bg-primary text-on-primary rounded-lg px-4 py-2 font-label text-data-label uppercase">
        {actionLabel}
      </Link>
    </div>
  );
}
