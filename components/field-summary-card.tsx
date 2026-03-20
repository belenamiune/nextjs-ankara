import CopyAliasButton from "./copy-alias-button";

type FieldSummaryCardProps = {
  totalAmount: number;
  alias?: string;
  fieldEvents: {
    id: number;
    label: string;
    eventDate: string;
    amount: number;
  }[];
};

const FieldSummaryCard = ({
  totalAmount,
  alias,
  fieldEvents,
}: FieldSummaryCardProps) => {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">Canchas del mes</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
            ${totalAmount.toLocaleString("es-AR")}
          </p>
        </div>

        <span className="rounded-full bg-[var(--surface-mint)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--ankara-blue)] ring-1 ring-[var(--ring)] dark:text-[var(--ankara-mint)]">
          {fieldEvents.length} domingos
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
        <div>
          <p className="mb-2 font-medium text-[var(--foreground)]">Alias</p>
          {alias ? <CopyAliasButton alias={alias} /> : <p>-</p>}
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
        {fieldEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 transition-colors hover:bg-[var(--surface-mint)]"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {event.label}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {event.eventDate} · ${event.amount.toLocaleString("es-AR")}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
};

export default FieldSummaryCard;