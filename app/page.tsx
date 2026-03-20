"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  adaptFieldEvent,
  adaptFieldPayment,
  adaptMonth,
  adaptMonthCharge,
  adaptPayment,
  adaptPlayer,
} from "@/lib/adapters";
import {
  getChargeByCode,
  getPaymentForPlayerAndCharge,
} from "@/lib/charge-helpers";
import {
  getPaidFieldEventsCountForPlayer,
  getTotalFieldAmount,
  getTotalFieldEventsCount,
} from "@/lib/field-helpers";
import PaymentStatusBadge from "@/components/payment-status-badge";
import FullScreenLoader from "@/components/full-screen-loader";
import FieldSummaryCard from "@/components/field-summary-card";
import {
  FieldEvent,
  FieldPayment,
  MonthCharge,
  MonthConfig,
  Payment,
  Player,
} from "@/types";
import {
  FieldEventRow,
  FieldPaymentRow,
  MonthChargeRow,
  MonthRow,
  PaymentRow,
  PlayerRow,
} from "@/types/database";
import CopyAliasButton from "@/components/copy-alias-button";
import PageModeSwitch from "@/components/page-mode-switch";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthConfig | null>(null);
  const [monthCharges, setMonthCharges] = useState<MonthCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fieldEvents, setFieldEvents] = useState<FieldEvent[]>([]);
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserSupabaseClient();

      const [
        playersResponse,
        monthResponse,
        chargesResponse,
        paymentsResponse,
        fieldEventsResponse,
        fieldPaymentsResponse,
      ] = await Promise.all([
        supabase.from("players").select("*").order("id", { ascending: true }),
        supabase.from("months").select("*").eq("is_current", true).single(),
        supabase
          .from("month_charges")
          .select("*, charge_concepts(*)")
          .order("id", { ascending: true }),
        supabase.from("payments").select("*").order("id", { ascending: true }),
        supabase
          .from("field_events")
          .select("*")
          .order("event_date", { ascending: true }),
        supabase
          .from("field_payments")
          .select("*")
          .order("id", { ascending: true }),
      ]);

      if (playersResponse.error) console.error(playersResponse.error);
      if (monthResponse.error) console.error(monthResponse.error);
      if (chargesResponse.error) console.error(chargesResponse.error);
      if (paymentsResponse.error) console.error(paymentsResponse.error);
      if (fieldEventsResponse.error) console.error(fieldEventsResponse.error);
      if (fieldPaymentsResponse.error) console.error(fieldPaymentsResponse.error);

      setPlayers(((playersResponse.data ?? []) as PlayerRow[]).map(adaptPlayer));
      setCurrentMonth(
        monthResponse.data ? adaptMonth(monthResponse.data as MonthRow) : null
      );
      setMonthCharges(
        ((chargesResponse.data ?? []) as MonthChargeRow[]).map(adaptMonthCharge)
      );
      setPayments(((paymentsResponse.data ?? []) as PaymentRow[]).map(adaptPayment));
      setFieldEvents(
        ((fieldEventsResponse.data ?? []) as FieldEventRow[]).map(adaptFieldEvent)
      );
      setFieldPayments(
        ((fieldPaymentsResponse.data ?? []) as FieldPaymentRow[]).map(
          adaptFieldPayment
        )
      );

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading || !currentMonth) {
    return <FullScreenLoader text="Cargando" />;
  }

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFields = getTotalFieldAmount(fieldEvents);
  const totalFieldEvents = getTotalFieldEventsCount(fieldEvents);
  const totalMonth = (profesorCharge?.amount ?? 0) + totalFields;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
       <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
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
        </div>

        <PageModeSwitch href="/admin" label="Admin" dark />
      </header>

        <section className="grid gap-4 xl:grid-cols-3">
          <ProfesorCard
            amount={profesorCharge?.amount ?? 0}
            dueDate={currentMonth.dueDate}
            alias={profesorCharge?.alias ?? currentMonth.alias}
          />

          <FieldSummaryCard
            totalAmount={totalFields}
            alias={currentMonth.alias}
            fieldEvents={fieldEvents}
          />

          <TotalCard
            total={totalMonth}
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              Estado de jugadoras
            </h2>
            <p className="text-sm text-gray-500">
              Estado por concepto del mes actual.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => {
              const profesorPayment = getPaymentForPlayerAndCharge(
                payments,
                player.id,
                profesorCharge?.id
              );

              const paidFieldsCount = getPaidFieldEventsCountForPlayer(
                fieldPayments,
                player.id,
                fieldEvents
              );

              return (
                <article
                  key={player.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <h3 className="text-base font-semibold text-gray-900">
                    {player.name}
                  </h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-600">
                        Zurdo
                      </span>
                      <PaymentStatusBadge paid={profesorPayment?.paid ?? false} />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-600">
                        Canchas
                      </span>
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                        {paidFieldsCount}/{totalFieldEvents} pagadas
                      </span>
                    </div>
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

type ProfesorCardProps = {
  amount: number;
  dueDate: string;
  alias?: string;
};

const ProfesorCard = ({
  amount,
  dueDate,
  alias,
}: ProfesorCardProps) => {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Zurdo</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        ${amount.toLocaleString("es-AR")}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>Vence: {dueDate}</p>
        <div>
          <p className="mb-2">Alias</p>
          {alias ? <CopyAliasButton alias={alias} /> : <p>-</p>}
        </div>
      </div>
    </article>
  );
};

type TotalCardProps = {
  total: number;
};

const TotalCard = ({ total }: TotalCardProps) => {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Total del mes</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        ${total.toLocaleString("es-AR")}
      </p>

    </article>
  );
};