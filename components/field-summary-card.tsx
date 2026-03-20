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
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Canchas del mes</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        ${totalAmount.toLocaleString("es-AR")}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div>
          <p className="mb-2">Alias</p>
          {alias ? <CopyAliasButton alias={alias} /> : <p>-</p>}
        </div>
        <p>{fieldEvents.length} domingos en el mes</p>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
        {fieldEvents.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3"
          >
            <p className="text-sm font-semibold text-gray-900">{event.label}</p>
            <p className="text-xs text-gray-500">
              {event.eventDate} · ${event.amount.toLocaleString("es-AR")}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
};

export default FieldSummaryCard;