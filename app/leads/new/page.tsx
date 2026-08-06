"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { AddressAutocomplete, type ResolvedAddress } from "@/components/leads/AddressAutocomplete";
import { createLead } from "@/lib/actions";
import { PROPERTY_TYPES, CONNECTION_TYPES } from "@/lib/types";

export default function NewLeadPage() {
  const [resolved, setResolved] = useState<ResolvedAddress | null>(null);

  return (
    <div className="min-h-screen flex bg-slate-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <nav className="sticky top-0 z-30 bg-primary text-on-primary flex items-center gap-4 w-full px-gutter-mobile md:px-gutter-desktop h-touch-target md:h-16">
          <Link href="/leads">
            <Icon name="arrow_back" />
          </Link>
          <h1 className="font-headline text-headline-md-mobile md:text-headline-md font-bold">New Lead</h1>
        </nav>

        <main className="p-gutter-mobile md:p-gutter-desktop pb-24 md:pb-8 max-w-2xl mx-auto space-y-6">
          <form action={createLead} className="space-y-6">
            <Section title="Customer Details" icon="person">
              <TextField name="customerName" label="Customer Name" required />
              <TextField name="phone" label="Phone" type="tel" required />
              <TextField name="altPhone" label="Alternate Phone" type="tel" />
              <TextField name="email" label="Email" type="email" />
            </Section>

            <Section title="Property Address" icon="location_on">
              <div className="space-y-1">
                <label className="font-label text-data-label text-on-surface-variant block uppercase">
                  Search Address
                </label>
                <AddressAutocomplete onSelect={setResolved} />
                <p className="text-body-sm text-on-surface-variant pt-1">
                  Powered by Google Maps — pick a suggestion to auto-fill city, state, and coordinates.
                </p>
              </div>

              <input type="hidden" name="address" value={resolved?.formattedAddress ?? ""} />
              <input type="hidden" name="lat" value={resolved?.lat ?? ""} />
              <input type="hidden" name="lng" value={resolved?.lng ?? ""} />

              {resolved && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <ReadOnlyField label="City" value={resolved.city} />
                  <ReadOnlyField label="State" value={resolved.state} />
                  <ReadOnlyField label="PIN Code" value={resolved.pinCode} />
                  <ReadOnlyField
                    label="Coordinates"
                    value={resolved.lat && resolved.lng ? `${resolved.lat.toFixed(4)}, ${resolved.lng.toFixed(4)}` : "—"}
                  />
                </div>
              )}
              {/* City/state are still submitted even though the fields above are read-only previews. */}
              <input type="hidden" name="city" value={resolved?.city ?? ""} />
              <input type="hidden" name="state" value={resolved?.state ?? ""} />
              <input type="hidden" name="pinCode" value={resolved?.pinCode ?? ""} />
            </Section>

            <Section title="Property & Connection" icon="bolt">
              <SelectField name="propertyType" label="Property Type" defaultValue="RESIDENTIAL">
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectField>
              <SelectField name="connectionType" label="Connection Type" defaultValue="SINGLE_PHASE">
                {CONNECTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </SelectField>
              <NumberField name="sanctionedLoadKw" label="Sanctioned Load (kW)" />
              <NumberField name="avgMonthlyBill" label="Avg. Monthly Bill (₹)" />
              <NumberField name="avgMonthlyUnits" label="Avg. Monthly Units (kWh)" />
            </Section>

            <Section title="Lead Source" icon="campaign">
              <TextField name="leadSource" label="Lead Source" placeholder="Referral, Website, Cold Call…" />
              <div className="space-y-1">
                <label className="font-label text-data-label text-on-surface-variant block uppercase">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-border-subtle rounded text-body-sm"
                />
              </div>
            </Section>

            <button
              type="submit"
              disabled={!resolved}
              className="w-full h-touch-target bg-primary text-on-primary font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              Create Lead
              <Icon name="chevron_right" />
            </button>
            {!resolved && (
              <p className="text-center text-body-sm text-outline">
                Select a property address above to enable lead creation.
              </p>
            )}
          </form>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name={icon} className="text-energy-orange" />
        <h3 className="font-headline text-headline-md">{title}</h3>
      </div>
      <div className="bg-white border border-border-subtle rounded-xl p-4 space-y-4 shadow-sm">{children}</div>
    </section>
  );
}

function TextField({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="font-label text-data-label text-on-surface-variant block uppercase">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded text-body-sm"
      />
    </div>
  );
}

function NumberField({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-1">
      <label className="font-label text-data-label text-on-surface-variant block uppercase">{label}</label>
      <input
        type="number"
        step="any"
        name={name}
        placeholder="0"
        className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
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
        {children}
      </select>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low border border-border-subtle rounded-lg p-3">
      <div className="font-label text-data-label text-outline uppercase">{label}</div>
      <div className="font-semibold text-primary text-body-sm mt-1">{value || "—"}</div>
    </div>
  );
}
