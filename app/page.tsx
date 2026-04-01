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
import AppSectionNav from "@/components/app-section-nav";
import Image from "next/image";
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
import ThemeToggle from "@/components/theme-toggle";

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

      const playersResponse = await supabase
        .from("players")
        .select("*")
        .order("id", { ascending: true });

      const monthResponse = await supabase
        .from("months")
        .select("*")
        .eq("is_current", true)
        .single();

      if (playersResponse.error) console.error(playersResponse.error);
      if (monthResponse.error || !monthResponse.data) {
        console.error(monthResponse.error);
        setLoading(false);
        return;
      }

      const currentMonthId = monthResponse.data.id;

      const chargesResponse = await supabase
        .from("month_charges")
        .select("*, charge_concepts(*)")
        .eq("month_id", currentMonthId)
        .order("id", { ascending: true });

      const fieldEventsResponse = await supabase
        .from("field_events")
        .select("*")
        .eq("month_id", currentMonthId)
        .order("event_date", { ascending: true });

      if (chargesResponse.error) console.error(chargesResponse.error);
      if (fieldEventsResponse.error) console.error(fieldEventsResponse.error);

      const monthChargeIds = (chargesResponse.data ?? []).map((charge) => charge.id);
      const fieldEventIds = (fieldEventsResponse.data ?? []).map((event) => event.id);

      const paymentsResponse = monthChargeIds.length
        ? await supabase
            .from("payments")
            .select("*")
            .in("month_charge_id", monthChargeIds)
            .order("id", { ascending: true })
        : { data: [], error: null };

      const fieldPaymentsResponse = fieldEventIds.length
        ? await supabase
            .from("field_payments")
            .select("*")
            .in("field_event_id", fieldEventIds)
            .order("id", { ascending: true })
        : { data: [], error: null };

      if (paymentsResponse.error) console.error(paymentsResponse.error);
      if (fieldPaymentsResponse.error) console.error(fieldPaymentsResponse.error);

      setPlayers(((playersResponse.data ?? []) as PlayerRow[]).map(adaptPlayer));
      setCurrentMonth(adaptMonth(monthResponse.data as MonthRow));
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
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Logo Ankara"
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="w-fit rounded-full bg-[var(--surface-mint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ankara-blue)] ring-1 ring-[var(--ring)] dark:text-[var(--ankara-mint)]">
                  Público
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Ankara
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Estado mensual de pagos del equipo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <ThemeToggle />
              <AppSectionNav />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
           <CurrentMonthCard label={currentMonth.label} />
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

          <TotalCard total={totalMonth} />
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
              Estado de jugadoras
            </h2>
            <p className="text-sm text-[var(--muted)]">
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
                className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  {player.name}
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      Zurdo
                    </span>
                    <PaymentStatusBadge paid={profesorPayment?.paid ?? false} />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      Canchas
                    </span>
                    <span className="rounded-full bg-[var(--surface-blue)] px-3 py-1 text-xs font-semibold text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]">
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

const ProfesorCard = ({ amount, dueDate, alias }: ProfesorCardProps) => {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">Zurdo</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
        ${amount.toLocaleString("es-AR")}
      </p>

      <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
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
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">Total del mes</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
        ${total.toLocaleString("es-AR")}
      </p>
    </article>
  );
};

type CurrentMonthCardProps = {
  label: string;
};

const CurrentMonthCard = ({ label }: CurrentMonthCardProps) => {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface-mint)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--muted)]">Mes actual</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
            {label}
          </p>
        </div>

        <span className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ankara-blue)] ring-1 ring-[var(--ring)] dark:text-[var(--ankara-mint)]">
          Activo
        </span>
      </div>
    </article>
  );
};