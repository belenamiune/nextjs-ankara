"use client";

type ReminderMessageBoxProps = {
  message: string;
};

const ReminderMessageBox = ({ message }: ReminderMessageBoxProps) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch (error) {
      console.error("No se pudo copiar el mensaje", error);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Recordatorio automático
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Texto listo para copiar y enviar al grupo o por mensaje privado.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Copiar mensaje
        </button>
      </div>

      <textarea
        readOnly
        value={message}
        className="min-h-[160px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 outline-none"
      />
    </section>
  );
};

export default ReminderMessageBox;