import { currentMonth, payments, players } from "@/lib/mock-data";
import AdminPaymentsPanel from "@/components/admin-payments-panel";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Admin
          </span>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Panel admin Ankara
            </h1>
            <p className="text-sm text-gray-500 sm:text-base">
              Gestioná pagos, revisá pendientes y copiá recordatorios para el
              equipo.
            </p>
          </div>
        </header>

        <AdminPaymentsPanel
          players={players}
          initialPayments={payments}
          month={currentMonth}
        />
      </div>
    </main>
  );
}