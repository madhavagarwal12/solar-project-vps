"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  calcFinancials,
  calcGeneration,
  monthlyGenerationSeries,
} from "@/lib/calculations";

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Tier = "small" | "recommended" | "large";

export function ResultsConfigurator({
  action,
  orientationFactorValue,
  shadingLossPctValue,
  shadingWarningText,
  pshHours,
  pshSource,
  recommendedPanelCount,
  panelWattage,
  defaultTariff,
  customerName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  orientationFactorValue: number;
  shadingLossPctValue: number;
  shadingWarningText: string | null;
  pshHours: number;
  pshSource: "PVGIS" | "STATE_AVERAGE";
  recommendedPanelCount: number;
  panelWattage: number;
  defaultTariff: number;
  customerName: string;
}) {
  const [tier, setTier] = useState<Tier>("recommended");
  const [tariffPerUnit, setTariffPerUnit] = useState(defaultTariff);
  const [costPerKw, setCostPerKw] = useState(55000);

  const panelCounts: Record<Tier, number> = {
    small: Math.max(1, Math.round(recommendedPanelCount * 0.6)),
    recommended: recommendedPanelCount,
    large: Math.round(recommendedPanelCount * 1.3),
  };

  const results = useMemo(() => {
    return (Object.keys(panelCounts) as Tier[]).reduce(
      (acc, t) => {
        const panelCount = panelCounts[t];
        const systemSizeKw = (panelCount * panelWattage) / 1000;
        const generation = calcGeneration({
          systemSizeKw,
          pshHours,
          orientationFactor: orientationFactorValue,
          shadingLossPct: shadingLossPctValue,
        });
        const financials = calcFinancials({
          systemSizeKw,
          costPerKw,
          tariffPerUnit,
          annualGenKwh: generation.annualGenKwh,
        });
        acc[t] = { panelCount, systemSizeKw, ...generation, ...financials };
        return acc;
      },
      {} as Record<
        Tier,
        { panelCount: number; systemSizeKw: number } & ReturnType<typeof calcGeneration> &
          ReturnType<typeof calcFinancials>
      >,
    );
  }, [panelCounts.small, panelCounts.recommended, panelCounts.large, tariffPerUnit, costPerKw, pshHours, orientationFactorValue, shadingLossPctValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = results[tier];
  const monthly = monthlyGenerationSeries(active.dailyGenKwh);
  const maxMonthly = Math.max(...monthly);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-data-label font-label text-energy-orange uppercase tracking-widest">
            Post-Assessment Analysis
          </span>
          <h2 className="text-headline-lg-mobile font-headline text-primary">Configure System Size</h2>
        </div>
        <div className="bg-surface-container border border-border-subtle p-1 rounded-xl flex items-center">
          {(["small", "recommended", "large"] as Tier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`px-4 py-2 text-body-sm font-medium rounded-lg transition-all ${
                tier === t
                  ? "bg-secondary-container text-on-secondary-container shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {results[t].systemSizeKw.toFixed(1)}kW
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <Icon name={pshSource === "PVGIS" ? "satellite_alt" : "map"} className="text-[16px]" />
        <span>
          {pshHours.toFixed(2)} PSH/day &bull;{" "}
          {pshSource === "PVGIS"
            ? "PVGIS live irradiation data for this site"
            : "State-level average estimate (site coordinates unavailable)"}
        </span>
      </div>

      {shadingWarningText && (
        <div className="bg-error-container text-on-error-container rounded-lg p-4 flex items-start gap-3">
          <Icon name="warning" />
          <p className="text-body-sm">{shadingWarningText}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric
          label="Daily Generation"
          value={active.dailyGenKwh.toFixed(1)}
          unit="kWh/day"
          icon="bolt"
          strip="bg-primary"
        />
        <Metric
          label="Monthly Savings"
          value={`₹${Math.round(active.monthlySavings).toLocaleString()}`}
          unit="/mo"
          icon="payments"
          strip="bg-secondary-container"
        />
        <Metric
          label="Payback Period"
          value={Number.isFinite(active.paybackYears) ? active.paybackYears.toFixed(1) : "—"}
          unit="Years"
          icon="timer"
          strip="bg-energy-orange"
        />
      </div>

      <div className="bg-white rounded-xl border border-border-subtle p-6">
        <h3 className="text-headline-md font-headline text-primary mb-1">Monthly Variation</h3>
        <p className="text-body-sm text-on-surface-variant mb-6">
          Projected generation across the seasonal cycle at {active.systemSizeKw.toFixed(1)} kWp
        </p>
        <div className="flex items-end justify-between gap-2 px-2 border-b border-border-subtle h-48">
          {monthly.map((v, i) => (
            <div key={MONTH_LABELS[i]} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t-sm transition-all duration-500"
                style={{ height: `${(v / maxMonthly) * 100}%` }}
              />
              <span className="text-[10px] font-label text-outline mt-2">{MONTH_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <form action={action} className="bg-white rounded-xl border border-border-subtle p-6 space-y-4">
        <input type="hidden" name="panelCount" value={active.panelCount} />
        <input type="hidden" name="panelWattage" value={panelWattage} />
        <h3 className="text-headline-md font-headline text-primary">Financial Inputs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-label text-data-label text-on-surface-variant uppercase block">
              Tariff (₹/unit)
            </label>
            <input
              type="number"
              step="0.1"
              name="tariffPerUnit"
              value={tariffPerUnit}
              onChange={(e) => setTariffPerUnit(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
            />
          </div>
          <div className="space-y-1">
            <label className="font-label text-data-label text-on-surface-variant uppercase block">
              System Cost (₹/kW)
            </label>
            <input
              type="number"
              step="1000"
              name="costPerKw"
              value={costPerKw}
              onChange={(e) => setCostPerKw(Number(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-surface-container-lowest border border-border-subtle rounded font-label text-data-value"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-body-sm">
          <SummaryStat label="Gross Cost" value={`₹${Math.round(active.grossCost).toLocaleString()}`} />
          <SummaryStat label="Subsidy" value={`₹${Math.round(active.subsidyAmount).toLocaleString()}`} />
          <SummaryStat label="Net Cost" value={`₹${Math.round(active.netCost).toLocaleString()}`} />
          <SummaryStat label="25yr Savings" value={`₹${Math.round(active.lifetimeSavings25yr).toLocaleString()}`} />
        </div>

        <button className="w-full bg-primary text-on-primary py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all">
          <span className="text-headline-md font-headline">Generate Proposal</span>
          <Icon name="description" />
        </button>
        <p className="text-center text-body-sm text-outline">
          Draft proposal will be prepared for lead: <span className="font-semibold text-on-surface">{customerName}</span>
        </p>
      </form>
    </>
  );
}

function Metric({
  label,
  value,
  unit,
  icon,
  strip,
}: {
  label: string;
  value: string;
  unit: string;
  icon: string;
  strip: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border-subtle p-5 relative overflow-hidden">
      <div className={`status-strip ${strip}`} />
      <div className="flex justify-between items-start mb-2">
        <span className="text-data-label font-label text-outline uppercase">{label}</span>
        <Icon name={icon} className="text-primary" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-headline-lg font-headline text-primary">{value}</span>
        <span className="text-body-base text-on-surface-variant">{unit}</span>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low border border-border-subtle rounded-lg p-3">
      <div className="font-label text-data-label text-outline uppercase">{label}</div>
      <div className="font-semibold text-primary">{value}</div>
    </div>
  );
}
