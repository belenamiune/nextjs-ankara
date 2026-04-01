import { MonthConfig } from "@/types";

type MonthlySummaryProps = {
  month: MonthConfig;
  totalFieldEvents: number;
};

const MonthlySummary = ({ month, totalFieldEvents }: MonthlySummaryProps) => {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
          Resumen del mes
        </h2>
        <p className="text-sm text-[var(--muted)]">Datos para administrar el cobro.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="Mes" value={month.label} variant="blue" />
        <SummaryItem label="Alias" value={month.alias} variant="default" />
        <SummaryItem label="Vencimiento" value={month.dueDate} variant="mint" />
        <SummaryItem
          label="Domingos"
          value={String(totalFieldEvents)}
          variant="default"
        />
      </div>
    </section>
  );
};

type SummaryItemProps = {
  label: string;
  value: string;
  variant?: "default" | "blue" | "mint";
};

const SummaryItem = ({ label, value, variant = "default" }: SummaryItemProps) => {
  const variants = {
    default: "bg-[var(--surface-soft)]",
    blue: "bg-[var(--surface-blue)]",
    mint: "bg-[var(--surface-mint)]",
  };

  return (
    <div className={`rounded-2xl border border-[var(--border)] p-4 ${variants[variant]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-[var(--foreground)] sm:text-base">
        {value}
      </p>
    </div>
  );
};

export default MonthlySummary;
