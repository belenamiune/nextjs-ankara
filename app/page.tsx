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
        supabase.from("payments_v2").select("*").order("id", { ascending: true }),
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
      setPayments(
        ((paymentsResponse.data ?? []) as PaymentRow[]).map(adaptPayment)
      );
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
    return <p className="p-6">Cargando...</p>;
  }

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFields = getTotalFieldAmount(fieldEvents);
  const totalFieldEvents = getTotalFieldEventsCount(fieldEvents);
  const totalMonth = (profesorCharge?.amount ?? 0) + totalFields;

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

        <section className="grid gap-4 xl:grid-cols-3">
          <ProfesorCard
            amount={profesorCharge?.amount ?? 0}
            dueDate={currentMonth.dueDate}
            alias={profesorCharge?.alias ?? currentMonth.alias}
            paymentLink={profesorCharge?.paymentLink}
          />

          <FieldSummaryCard
            totalAmount={totalFields}
            dueDate={currentMonth.dueDate}
            alias={currentMonth.alias}
            totalPaymentLink={currentMonth.fieldTotalPaymentLink}
            fieldEvents={fieldEvents}
          />

          <TotalCard
            total={totalMonth}
            dueDate={currentMonth.dueDate}
            paymentLink={currentMonth.totalPaymentLink}
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
                        Profesor
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
  paymentLink?: string;
};

const ProfesorCard = ({
  amount,
  dueDate,
  alias,
  paymentLink,
}: ProfesorCardProps) => {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Profesor</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        ${amount.toLocaleString("es-AR")}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>Vence: {dueDate}</p>
        <p>Alias: {alias ?? "-"}</p>
      </div>

      {paymentLink && (
        <a
          href={paymentLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Pagar profesor
        </a>
      )}
    </article>
  );
};

type FieldSummaryCardProps = {
  totalAmount: number;
  dueDate: string;
  alias?: string;
  totalPaymentLink?: string;
  fieldEvents: FieldEvent[];
};

const FieldSummaryCard = ({
  totalAmount,
  dueDate,
  alias,
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
        <p>Alias: {alias ?? "-"}</p>
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

type TotalCardProps = {
  total: number;
  dueDate: string;
  paymentLink?: string;
};

const TotalCard = ({ total, dueDate, paymentLink }: TotalCardProps) => {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">Total del mes</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        ${total.toLocaleString("es-AR")}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <p>Vence: {dueDate}</p>
      </div>

      {paymentLink && (
        <a
          href={paymentLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Pagar total del mes
        </a>
      )}
    </article>
  );
};