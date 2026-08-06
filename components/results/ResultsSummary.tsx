import Link from "next/link";
import { Icon } from "@/components/Icon";
import { monthlyGenerationSeries } from "@/lib/calculations";

const MONTH_LABELS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

interface CalcLike {
  systemSizeKw: number;
  panelCount: number;
  panelWattage: number;
  dailyGenKwh: number;
  monthlyGenKwh: number;
  annualGenKwh: number;
  shadingLossPct: number;
  pshHours: number;
  pshSource: string;
  grossCost: number;
  subsidyAmount: number;
  netCost: number;
  monthlySavings: number;
  annualSavings: number;
  paybackYears: number;
  lifetimeSavings25yr: number;
  roiPct: number;
  co2OffsetAnnualTons: number;
}

export function ResultsSummary({
  calc,
  leadId,
  customerName,
}: {
  calc: CalcLike;
  leadId: string;
  customerName: string;
}) {
  const monthly = monthlyGenerationSeries(calc.dailyGenKwh);
  const maxMonthly = Math.max(...monthly);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-data-label font-label text-energy-orange uppercase tracking-widest">
            Final Assessment
          </span>
          <h2 className="text-headline-lg-mobile font-headline text-primary">Calculation Results</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {calc.panelCount} &times; {calc.panelWattage}W panels &bull; {calc.systemSizeKw.toFixed(1)} kWp system
          </p>
        </div>
        <Link
          href={`/leads/${leadId}/results?recalculate=1`}
          className="px-4 py-2 border border-primary text-primary rounded-full font-bold text-body-sm hover:bg-surface-container-low transition-colors"
        >
          Recalculate
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-border-subtle p-6 flex items-center gap-4">
        <div className="status-strip bg-secondary-container" />
        <Icon name="warning" className={calc.shadingLossPct > 20 ? "text-status-overdue" : "text-status-done"} />
        <p className="text-body-sm text-on-surface-variant">
          Shading loss factor: <span className="font-semibold text-on-surface">{calc.shadingLossPct}%</span>{" "}
          {calc.shadingLossPct > 20
            ? "— heavy shading, micro-inverters recommended."
            : calc.shadingLossPct > 0
              ? "— minor loss, within acceptable range."
              : "— no shading detected."}
        </p>
      </div>

      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <Icon name={calc.pshSource === "PVGIS" ? "satellite_alt" : "map"} className="text-[16px]" />
        <span>
          {calc.pshHours.toFixed(2)} PSH/day &bull;{" "}
          {calc.pshSource === "PVGIS"
            ? "PVGIS live irradiation data for this site"
            : "State-level average estimate (site coordinates unavailable)"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Daily Generation" value={calc.dailyGenKwh.toFixed(1)} unit="kWh/day" icon="bolt" strip="bg-primary" />
        <Metric
          label="Monthly Savings"
          value={`₹${Math.round(calc.monthlySavings).toLocaleString()}`}
          unit="/mo"
          icon="payments"
          strip="bg-secondary-container"
        />
        <Metric
          label="Payback Period"
          value={Number.isFinite(calc.paybackYears) ? calc.paybackYears.toFixed(1) : "—"}
          unit="Years"
          icon="timer"
          strip="bg-energy-orange"
        />
      </div>

      <div className="bg-white rounded-xl border border-border-subtle p-6">
        <h3 className="text-headline-md font-headline text-primary mb-1">Monthly Variation</h3>
        <p className="text-body-sm text-on-surface-variant mb-6">Projected generation across the seasonal cycle</p>
        <div className="flex items-end justify-between gap-2 px-2 border-b border-border-subtle h-48">
          {monthly.map((v, i) => (
            <div key={MONTH_LABELS[i]} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-primary rounded-t-sm" style={{ height: `${(v / maxMonthly) * 100}%` }} />
              <span className="text-[10px] font-label text-outline mt-2">{MONTH_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStat label="Gross Cost" value={`₹${Math.round(calc.grossCost).toLocaleString()}`} />
        <SummaryStat label="Subsidy" value={`₹${Math.round(calc.subsidyAmount).toLocaleString()}`} />
        <SummaryStat label="Net Cost" value={`₹${Math.round(calc.netCost).toLocaleString()}`} />
        <SummaryStat label="Annual Savings" value={`₹${Math.round(calc.annualSavings).toLocaleString()}`} />
        <SummaryStat label="25yr Lifetime Savings" value={`₹${Math.round(calc.lifetimeSavings25yr).toLocaleString()}`} />
        <SummaryStat label="ROI" value={`${calc.roiPct.toFixed(0)}%`} />
        <SummaryStat label="CO₂ Offset / yr" value={`${calc.co2OffsetAnnualTons.toFixed(2)} t`} />
        <SummaryStat label="Annual Generation" value={`${Math.round(calc.annualGenKwh).toLocaleString()} kWh`} />
      </div>

      <div className="pt-2 pb-8">
        <Link
          href={`/leads/${leadId}/proposal`}
          className="w-full bg-secondary-container text-on-secondary-container py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="text-headline-md font-headline">View Proposal</span>
          <Icon name="description" />
        </Link>
        <Link
          href="/leads"
          className="w-full mt-3 bg-primary text-on-primary py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="text-headline-md font-headline">Back to Lead Queue</span>
          <Icon name="arrow_forward" />
        </Link>
        <p className="text-center text-body-sm text-outline mt-4">
          Proposal preview ready for <span className="font-semibold text-on-surface">{customerName}</span>.
        </p>
      </div>
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
    <div className="bg-white border border-border-subtle rounded-lg p-4">
      <div className="font-label text-data-label text-outline uppercase">{label}</div>
      <div className="font-semibold text-primary text-body-base mt-1">{value}</div>
    </div>
  );
}
