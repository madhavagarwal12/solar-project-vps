import Link from "next/link";
import { Icon } from "./Icon";

export const VISIT_STEPS = [
  { key: "property", label: "Property Details", path: "property" },
  { key: "shading", label: "Shading Analysis", path: "shading" },
  { key: "electrical", label: "Electrical Details", path: "electrical" },
  { key: "roof-planner", label: "Roof Planner", path: "roof-planner" },
  { key: "results", label: "Calculation Results", path: "results" },
] as const;

export function WizardHeader({
  leadCode,
  leadName,
  backHref,
}: {
  leadCode: string;
  leadName: string;
  backHref: string;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-primary text-on-primary h-touch-target flex justify-between items-center px-gutter-mobile md:px-gutter-desktop">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="flex items-center justify-center active:scale-95 transition-all">
          <Icon name="arrow_back" />
        </Link>
        <h1 className="font-headline text-headline-md-mobile md:text-headline-md font-bold">
          Site Assessment
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-label text-body-sm opacity-80 uppercase tracking-widest hidden sm:inline">
          {leadName} &bull; {leadCode}
        </span>
        <Icon name="signal_cellular_alt" />
      </div>
    </header>
  );
}

export function WizardStepper({ currentStep }: { currentStep: number }) {
  const total = VISIT_STEPS.length;
  const pct = Math.round((currentStep / total) * 100);
  return (
    <div className="flex flex-col gap-2 pt-4">
      <div className="flex justify-between items-end">
        <span className="font-label text-data-label text-on-surface-variant uppercase tracking-tighter">
          Step {String(currentStep).padStart(2, "0")} of {String(total).padStart(2, "0")}
        </span>
        <span className="font-label text-data-label text-on-surface-variant">{pct}% Complete</span>
      </div>
      <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
        <div
          className="bg-secondary-container h-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <h2 className="font-headline text-headline-lg-mobile mt-2">{VISIT_STEPS[currentStep - 1].label}</h2>
    </div>
  );
}
