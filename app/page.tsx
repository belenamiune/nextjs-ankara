"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { adaptMonth, adaptPayment, adaptPlayer } from "@/lib/adapters";
import { getMonthSummary } from "@/lib/get-month-summary";
import MonthlySummary from "@/components/monthly-summary";
import PaymentStatusBadge from "@/components/payment-status-badge";
import { MonthConfig, Payment, Player } from "@/types";
import { MonthRow, PaymentRow, PlayerRow } from "@/types/database";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthConfig | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserSupabaseClient();

      const [playersResponse, monthResponse, paymentsResponse] =
        await Promise.all([
          supabase.from("players").select("*").order("id", { ascending: true }),
          supabase.from("months").select("*").eq("is_current", true).single(),
          supabase.from("payments").select("*").order("id", { ascending: true }),
        ]);

      if (playersResponse.error) {
        console.error("Error trayendo players:", playersResponse.error);
      }

      if (monthResponse.error) {
        console.error("Error trayendo month:", monthResponse.error);
      }

      if (paymentsResponse.error) {
        console.error("Error trayendo payments:", paymentsResponse.error);
      }

      const adaptedPlayers = ((playersResponse.data ?? []) as PlayerRow[]).map(adaptPlayer);
      const adaptedMonth = monthResponse.data
        ? adaptMonth(monthResponse.data as MonthRow)
        : null;
      const adaptedPayments = ((paymentsResponse.data ?? []) as PaymentRow[]).map(adaptPayment);

      setPlayers(adaptedPlayers);
      setCurrentMonth(adaptedMonth);
      setPayments(adaptedPayments);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading || !currentMonth) {
    return <p>Cargando...</p>;
  }

  const summary = getMonthSummary(players, payments, currentMonth.amount);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 ring-1 ring-gray-200">
            Público
          </span>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ankara
            </h1>
            <p className="text-sm text-gray-500 sm:text-base">
              Estado mensual de pagos del equipo.
            </p>
          </div>
        </header>

        <MonthlySummary month={currentMonth} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pagaron" value={String(summary.paidCount)} />
          <StatCard label="Pendientes" value={String(summary.pendingCount)} />
          <StatCard
            label="Total esperado"
            value={`$${summary.totalExpected.toLocaleString("es-AR")}`}
          />
          <StatCard
            label="Total cobrado"
            value={`$${summary.totalCollected.toLocaleString("es-AR")}`}
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Estado de jugadoras
            </h2>
            <p className="text-sm text-gray-500">
              Visualización pública del estado de pago del mes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const payment = payments.find(
                (payment) => payment.playerId === player.id
              );

              return (
                <article
                  key={player.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {player.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Jugadora activa
                      </p>
                    </div>

                    <PaymentStatusBadge paid={payment?.paid ?? false} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

const StatCard = ({ label, value }: StatCardProps) => {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {value}
      </p>
    </article>
  );
};