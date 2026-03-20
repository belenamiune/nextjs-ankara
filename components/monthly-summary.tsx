import { MonthConfig } from "@/types";

type MonthlySummaryProps = {
  month: MonthConfig;
  totalFieldEvents: number;
};

const MonthlySummary = ({ month, totalFieldEvents }: MonthlySummaryProps) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
          Resumen del mes
        </h2>
        <p className="text-sm text-gray-500">
          Datos principales para compartir y administrar el cobro.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="Mes" value={month.label} />
        <SummaryItem label="Alias" value={month.alias} />
        <SummaryItem label="Vencimiento" value={month.dueDate} />
        <SummaryItem label="Domingos" value={String(totalFieldEvents)} />
      </div>
    </section>
  );
};

type SummaryItemProps = {
  label: string;
  value: string;
};

const SummaryItem = ({ label, value }: SummaryItemProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-gray-900 sm:text-base">
        {value}
      </p>
    </div>
  );
};

export default MonthlySummary;