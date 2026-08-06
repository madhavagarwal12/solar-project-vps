"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { calcRoofArea, PANEL_AREA_SQFT } from "@/lib/calculations";
import { PANEL_WATTAGES } from "@/lib/types";

export function RoofPlannerCanvas({
  leadCode,
  leadName,
  action,
  initialTotalArea,
  initialTilt,
}: {
  leadCode: string;
  leadName: string;
  action: (formData: FormData) => void | Promise<void>;
  initialTotalArea: number;
  initialTilt: number;
}) {
  const [totalArea, setTotalArea] = useState(initialTotalArea);
  const [obstructionArea, setObstructionArea] = useState(Math.round(initialTotalArea * 0.08));
  const [panelWattage, setPanelWattage] = useState(550);

  const { netUsableAreaSqft, maxPanels } = useMemo(
    () => calcRoofArea({ totalRoofAreaSqft: totalArea, obstructionAreaSqft: obstructionArea }),
    [totalArea, obstructionArea],
  );

  const systemSizeKw = (maxPanels * panelWattage) / 1000;
  const displayPanels = Math.min(maxPanels, 60);
  const cols = Math.max(4, Math.ceil(Math.sqrt(displayPanels * 1.6)));

  return (
    <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100vh-160px)]">
      {/* Sidebar: Tools & Data */}
      <aside className="w-full md:w-80 shrink-0 bg-surface border border-border-subtle rounded-xl flex flex-col overflow-hidden">
        <div className="p-gutter-mobile border-b border-border-subtle">
          <h2 className="text-headline-md font-headline mb-1">Roof Planner</h2>
          <p className="text-body-sm text-on-surface-variant">
            Lead: {leadName} &bull; {leadCode}
          </p>
        </div>

        <div className="p-gutter-mobile grid grid-cols-2 gap-2 bg-surface-container-low">
          <div className="p-3 bg-white border border-border-subtle rounded-lg">
            <span className="font-label text-data-label text-on-surface-variant block uppercase">
              Panels Placed
            </span>
            <span className="font-label text-data-value text-primary">{maxPanels}</span>
          </div>
          <div className="p-3 bg-white border border-border-subtle rounded-lg">
            <span className="font-label text-data-label text-on-surface-variant block uppercase">
              Sys Size (kWp)
            </span>
            <span className="font-label text-data-value text-secondary">{systemSizeKw.toFixed(2)}</span>
          </div>
        </div>

        <form action={action} className="p-gutter-mobile space-y-4 flex-1 overflow-y-auto">
          <input type="hidden" name="panelCount" value={maxPanels} />

          <div className="space-y-1">
            <label className="font-label text-data-label text-on-surface-variant block uppercase">
              Total Roof Area (sq ft)
            </label>
            <input
              type="number"
              name="totalRoofAreaSqft"
              value={totalArea}
              onChange={(e) => setTotalArea(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-white border border-border-subtle rounded font-label text-data-value"
            />
          </div>
          <div className="space-y-1">
            <label className="font-label text-data-label text-on-surface-variant block uppercase">
              Obstruction Area (sq ft)
            </label>
            <input
              type="number"
              name="obstructionAreaSqft"
              value={obstructionArea}
              onChange={(e) => setObstructionArea(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-white border border-border-subtle rounded font-label text-data-value"
            />
          </div>
          <div className="space-y-1">
            <label className="font-label text-data-label text-on-surface-variant block uppercase">
              Panel Wattage
            </label>
            <select
              name="panelWattage"
              value={panelWattage}
              onChange={(e) => setPanelWattage(Number(e.target.value))}
              className="w-full h-10 px-3 bg-white border border-border-subtle rounded text-body-sm font-semibold"
            >
              {PANEL_WATTAGES.map((w) => (
                <option key={w} value={w}>
                  {w}W
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between p-2">
              <span className="text-body-sm">Net Usable Area</span>
              <span className="font-label text-data-value">{netUsableAreaSqft.toFixed(0)} sqft</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-body-sm">Panel Footprint</span>
              <span className="font-label text-data-value">{PANEL_AREA_SQFT} sqft</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-body-sm">Proposed Tilt</span>
              <span className="font-label text-data-value">{initialTilt}&deg;</span>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-4 bg-secondary text-on-secondary font-bold rounded-lg shadow-lg active:scale-95 transition-all">
              Finalize Layout &amp; Continue
            </button>
          </div>
        </form>
      </aside>

      {/* Main Workspace: Technical Drawing Area */}
      <section className="flex-1 relative bg-slate-surface canvas-grid rounded-xl border border-border-subtle overflow-hidden min-h-[420px]">
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1 border border-border-subtle rounded-full">
            <span className="w-2 h-2 rounded-full bg-status-done animate-pulse" />
            <span className="font-label text-data-label text-on-surface">LIVE PREVIEW &bull; {maxPanels} PANELS</span>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="relative w-full max-w-2xl aspect-[4/3] bg-white border-2 border-primary shadow-2xl rounded-sm overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div
                className="grid gap-1 w-[85%] h-[75%]"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: displayPanels }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-primary/90 border border-primary-fixed-dim rounded-sm transition-all hover:bg-secondary"
                    style={{ aspectRatio: "1.6 / 1" }}
                  />
                ))}
              </div>
            </div>
            {maxPanels > displayPanels && (
              <div className="absolute bottom-2 right-2 bg-white/90 border border-border-subtle rounded px-2 py-1 text-[10px] font-label uppercase text-outline">
                +{maxPanels - displayPanels} more panels (preview capped)
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4">
          <div className="w-12 h-12 rounded-full border border-outline flex items-center justify-center bg-white/70">
            <span className="font-bold text-[10px]">N</span>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Icon name="architecture" className="text-outline" />
        </div>
      </section>
    </div>
  );
}
