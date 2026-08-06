import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { LeadsExplorer } from "@/components/leads/LeadsExplorer";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assessment: {
        include: {
          calculations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const visitsInProgress = leads.filter((l) => l.status === "VISIT_IN_PROGRESS").length;
  const pendingProposals = leads.filter(
    (l) => l.status === "PROPOSAL_GENERATED" || l.status === "PROPOSAL_SENT",
  ).length;
  const totalPipelineKwh = leads.reduce((sum, l) => {
    const calc = l.assessment?.calculations[0];
    return sum + (calc?.annualGenKwh ?? 0);
  }, 0);

  const serializedLeads = leads.map((l) => ({
    id: l.id,
    leadCode: l.leadCode,
    customerName: l.customerName,
    address: l.address,
    city: l.city,
    state: l.state,
    propertyType: l.propertyType,
    status: l.status,
    roofCondition: l.assessment?.roofCondition ?? null,
    systemSizeKw: l.assessment?.calculations[0]?.systemSizeKw ?? null,
    sanctionedLoadKw: l.sanctionedLoadKw,
  }));

  return (
    <div className="min-h-screen flex bg-slate-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <LeadsExplorer
          leads={serializedLeads}
          visitsInProgress={visitsInProgress}
          totalVisits={leads.length}
          pendingProposals={pendingProposals}
          totalPipelineKwh={Math.round(totalPipelineKwh)}
        />
      </div>
      <BottomNav />
    </div>
  );
}
