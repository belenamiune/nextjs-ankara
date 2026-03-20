type FieldSummaryCardProps = {
  totalAmount: number;
  dueDate: string;
  totalPaymentLink?: string;
  fieldEvents: {
    id: number;
    label: string;
    eventDate: string;
    amount: number;
    paymentLink?: string;
  }[];
};

const FieldSummaryCard = ({
  totalAmount,
  dueDate,
  totalPaymentLink,
  fieldEvents,
}: FieldSummaryCardProps) => {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Canchas del mes</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        ${totalAmount.toLocaleString("es-AR")}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>Vence: {dueDate}</p>
        <p>{fieldEvents.length} domingos en el mes</p>
      </div>

      {totalPaymentLink && (
        <a
          href={totalPaymentLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Pagar total canchas
        </a>
      )}

      <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
        {fieldEvents.map((event) => (
          <div
            key={event.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{event.label}</p>
              <p className="text-xs text-gray-500">
                {event.eventDate} · ${event.amount.toLocaleString("es-AR")}
              </p>
            </div>

            {event.paymentLink && (
              <a
                href={event.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Pagar individual
              </a>
            )}
          </div>
        ))}
      </div>
    </article>
  );
};

export default FieldSummaryCard;