"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { STATUS_LABELS, statusColor } from "@/lib/types";

export interface LeadListItem {
  id: string;
  leadCode: string;
  customerName: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  status: string;
  roofCondition: string | null;
  systemSizeKw: number | null;
  sanctionedLoadKw: number | null;
}

const STRIP_COLOR: Record<string, string> = {
  overdue: "bg-status-overdue",
  upcoming: "bg-energy-orange",
  done: "bg-status-done",
  neutral: "bg-primary",
};

const BADGE_CLASS: Record<string, string> = {
  overdue: "bg-error-container text-on-error-container",
  upcoming: "bg-secondary-container text-on-secondary-container",
  done: "bg-surface-container-highest text-on-surface-variant",
  neutral: "bg-surface-container-highest text-on-surface-variant",
};

export function LeadsExplorer({
  leads,
  visitsInProgress,
  totalVisits,
  pendingProposals,
  totalPipelineKwh,
}: {
  leads: LeadListItem[];
  visitsInProgress: number;
  totalVisits: number;
  pendingProposals: number;
  totalPipelineKwh: number;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.customerName.toLowerCase().includes(q) ||
        l.leadCode.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q),
    );
  }, [leads, query]);

  return (
    <>
      {/* Mobile top bar */}
      <nav className="sticky top-0 z-30 bg-primary text-on-primary flex justify-between items-center w-full px-gutter-mobile h-touch-target md:hidden">
        <h1 className="font-headline text-headline-md-mobile font-bold">Leads</h1>
        <div className="flex items-center gap-4">
          <Icon name="signal_cellular_alt" />
          <Icon name="notifications" />
        </div>
      </nav>

      {/* Desktop top bar */}
      <header className="hidden md:flex sticky top-0 z-30 bg-primary text-on-primary justify-between items-center w-full px-gutter-desktop h-16 shadow-md">
        <div className="flex items-center gap-4">
          <span className="font-headline text-headline-md font-bold tracking-tight">
            HELIOS LEAD CONTROL
          </span>
          <span className="px-2 py-0.5 bg-secondary text-on-secondary text-[10px] font-bold rounded uppercase tracking-widest">
            Active System
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Icon name="signal_cellular_alt" className="text-sm" />
            <span className="font-label text-data-label opacity-80 uppercase">Field Sync: Online</span>
          </div>
          <Link
            href="/leads/new"
            className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full font-bold text-body-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Icon name="add" className="text-sm" />
            NEW ASSESSMENT
          </Link>
        </div>
      </header>

      <main className="p-gutter-mobile md:p-gutter-desktop space-y-6 md:space-y-8 pb-24 md:pb-8 md:max-w-7xl md:mx-auto">
        {/* KPI cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="col-span-2 md:col-span-2 bg-white border border-border-subtle p-5 md:p-6 rounded-lg md:rounded-xl flex flex-col md:flex-row md:items-center md:justify-between justify-between shadow-sm">
            <div>
              <p className="font-label text-data-label uppercase tracking-widest text-outline mb-0 md:mb-2">
                Total Active Pipeline
              </p>
              <h2 className="font-label text-headline-lg-mobile md:text-headline-lg text-primary mt-1 md:mt-0">
                {totalPipelineKwh.toLocaleString()}{" "}
                <span className="text-body-sm font-normal text-outline">kWh Potential</span>
              </h2>
            </div>
          </div>
          <div className="col-span-1 bg-white border border-border-subtle p-5 rounded-lg md:rounded-xl shadow-sm flex flex-col justify-between">
            <p className="font-label text-data-label uppercase tracking-widest text-outline mb-1">
              Visits In Progress
            </p>
            <div className="flex items-end gap-2">
              <span className="font-label text-headline-lg-mobile md:text-4xl text-primary">
                {String(visitsInProgress).padStart(2, "0")}
              </span>
              <span className="text-outline font-bold text-body-sm mb-1 pb-1">/ {totalVisits}</span>
            </div>
          </div>
          <div className="col-span-1 bg-primary text-white p-5 rounded-lg md:rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <p className="font-label text-data-label uppercase tracking-widest text-on-primary-container mb-1">
                Pending Proposals
              </p>
              <span className="font-label text-headline-lg-mobile md:text-4xl">
                {String(pendingProposals).padStart(2, "0")}
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Icon name="solar_power" className="text-[100px]" filled />
            </div>
          </div>
        </section>

        {/* Search & filter */}
        <section className="flex gap-2 items-center justify-between">
          <div className="flex gap-2 flex-1 md:max-w-md">
            <div className="relative grow">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 md:py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="Search by customer, ID, or city..."
                type="text"
              />
            </div>
            <button className="flex items-center justify-center bg-white border border-border-subtle rounded-lg w-touch-target h-touch-target md:h-auto md:px-3 hover:bg-surface-container-low transition-colors">
              <Icon name="filter_list" />
            </button>
          </div>
        </section>

        <h2 className="font-headline text-headline-md text-on-surface flex items-center gap-2">
          Active Queue
          <span className="text-body-sm font-normal text-outline">({filtered.length} Total)</span>
        </h2>

        {/* Mobile card list */}
        <section className="space-y-4 md:hidden">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {filtered.length === 0 && <EmptyState />}
        </section>

        {/* Desktop data grid */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="p-4 font-label text-data-label uppercase text-on-surface-variant w-12" />
                <th className="p-4 font-label text-data-label uppercase text-on-surface-variant">Lead Identity</th>
                <th className="p-4 font-label text-data-label uppercase text-on-surface-variant">Status</th>
                <th className="p-4 font-label text-data-label uppercase text-on-surface-variant">System Size</th>
                <th className="p-4 font-label text-data-label uppercase text-on-surface-variant">Roof Condition</th>
                <th className="p-4 font-label text-data-label uppercase text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filtered.map((lead) => {
                const color = statusColor(lead.status);
                return (
                  <tr key={lead.id} className="hover:bg-surface-container-low/50 transition-colors group relative">
                    <td className="p-4 relative">
                      <div className={`status-strip ${STRIP_COLOR[color]}`} />
                      <span className="font-label text-outline text-[10px]">{lead.leadCode}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-container rounded flex items-center justify-center text-on-primary">
                          <Icon name="home" className="text-sm" />
                        </div>
                        <div>
                          <div className="font-bold text-primary font-body-base">{lead.customerName}</div>
                          <div className="text-xs text-outline font-label uppercase">
                            {lead.city} &bull; {lead.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${BADGE_CLASS[color]}`}>
                        {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] ?? lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-label text-primary">
                        {lead.systemSizeKw != null ? (
                          <>
                            {lead.systemSizeKw.toFixed(1)} <span className="text-xs font-normal opacity-60">kW DC</span>
                          </>
                        ) : (
                          <span className="text-xs font-normal opacity-60">Pending assessment</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm">{lead.roofCondition ?? "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="inline-flex text-primary hover:bg-secondary-container p-2 rounded-lg transition-colors"
                      >
                        <Icon name="chevron_right" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    No leads match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function LeadCard({ lead }: { lead: LeadListItem }) {
  const color = statusColor(lead.status);
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="relative block bg-white border border-border-subtle rounded-lg p-5 overflow-hidden active:scale-95 transition-all cursor-pointer"
    >
      <div className={`status-strip ${STRIP_COLOR[color]}`} />
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-headline text-headline-md-mobile text-primary">{lead.customerName}</h3>
          <p className="text-body-sm text-outline flex items-center gap-1">
            <Icon name="location_on" className="text-[14px]" />
            {lead.address}, {lead.city}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-data-label font-label uppercase ${BADGE_CLASS[color]}`}>
          {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] ?? lead.status}
        </span>
      </div>
      <div className="flex justify-between items-center border-t border-border-subtle pt-4">
        <div className="flex flex-col">
          <span className="font-label text-data-label text-outline uppercase">Lead ID</span>
          <span className="font-label text-body-base">{lead.leadCode}</span>
        </div>
        <div className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center">
          <Icon name="chevron_right" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="w-full py-8 border-2 border-dashed border-border-subtle rounded-lg text-outline font-label uppercase tracking-widest text-center">
      No leads match your search
    </div>
  );
}
