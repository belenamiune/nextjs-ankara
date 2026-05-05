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
import { getChargeByCode, getPaymentForPlayerAndCharge } from "@/lib/charge-helpers";
import {
  getPaidFieldEventsCountForPlayer,
  getTotalFieldAmount,
  getTotalFieldEventsCount,
} from "@/lib/field-helpers";
import PaymentStatusBadge from "@/components/payment-status-badge";
import FullScreenLoader from "@/components/full-screen-loader";
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
import ThemeToggle from "@/components/theme-toggle";
import AppSectionNav from "@/components/app-section-nav";

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
        ((fieldPaymentsResponse.data ?? []) as FieldPaymentRow[]).map(adaptFieldPayment)
      );

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading || !currentMonth) {
    return <FullScreenLoader text="Cargando" />;
  }

  const getSortableLastName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : fullName.toLowerCase();
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const lastNameA = getSortableLastName(a.name);
    const lastNameB = getSortableLastName(b.name);

    const compareLastName = lastNameA.localeCompare(lastNameB, "es", {
      sensitivity: "base",
    });

    if (compareLastName !== 0) {
      return compareLastName;
    }

    return a.name.localeCompare(b.name, "es", {
      sensitivity: "base",
    });
  });

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFields = getTotalFieldAmount(fieldEvents);
  const totalFieldEvents = getTotalFieldEventsCount(fieldEvents);
  const totalMonth = (profesorCharge?.amount ?? 0) + totalFields;
  const alias = profesorCharge?.alias ?? currentMonth.alias;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

              <div className="space-y-1">
                <span className="inline-flex w-fit rounded-full bg-[var(--surface-mint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ankara-blue)] ring-1 ring-[var(--ring)] dark:text-[var(--ankara-mint)]">
                  Público
                </span>

                <h1 className="text-2xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-3xl">
                  Ankara
                </h1>

                <p className="text-sm text-[var(--muted)] sm:text-base">
                  Estado mensual de pagos del equipo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <ThemeToggle />
              <AppSectionNav />
            </div>
          </div>
        </header>

        <MonthlyOverviewCard
          monthLabel={currentMonth.label}
          totalMonth={totalMonth}
          dueDate={currentMonth.dueDate}
          alias={alias}
        />

        <section className="grid gap-4 md:grid-cols-2">
          <ConceptSummaryCard
            title="Entrenamiento"
            amount={profesorCharge?.amount ?? 0}
            description="Pago mensual cuota de entrenamiento."
          />

          <FieldConceptSummaryCard
            totalAmount={totalFields}
            totalFieldEvents={totalFieldEvents}
          />
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
              Estado de jugadoras
            </h2>
            <p className="text-sm text-[var(--muted)]">Resumen del mes actual.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] items-center gap-4 bg-[var(--surface-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)] md:grid">
              <span>Jugadora</span>
              <span>Entrenamiento</span>
              <span>Canchas</span>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {sortedPlayers.map((player, index) => {
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
                    className="grid gap-3 bg-[var(--card)] px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] md:items-center md:gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
                        {index + 1}. {player.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:justify-start">
                      <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)] md:hidden">
                        Zurdo
                      </span>
                      {player.active ? (
                        <PaymentStatusBadge paid={profesorPayment?.paid ?? false} />
                      ) : (
                        <span className="inline-flex w-fit rounded-full bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400 px-3 py-1 text-xs font-semibold">
                          Inactiva
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 md:justify-start">
                      <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)] md:hidden">
                        Canchas
                      </span>

                    {player.active ? (
                        <span className="inline-flex w-fit rounded-full bg-[var(--surface-blue)] px-3 py-1 text-xs font-semibold text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]">
                          {paidFieldsCount}/{totalFieldEvents} pagadas
                        </span>
                      ) : (
                        <span className="inline-flex w-fit rounded-full bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400 px-3 py-1 text-xs font-semibold">
                          Inactiva
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type MonthlyOverviewCardProps = {
  monthLabel: string;
  totalMonth: number;
  dueDate: string;
  alias?: string;
};

const MonthlyOverviewCard = ({
  monthLabel,
  totalMonth,
  dueDate,
  alias,
}: MonthlyOverviewCardProps) => {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[var(--surface-mint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ankara-blue)] ring-1 ring-[var(--ring)] dark:text-[var(--ankara-mint)]">
              Mes activo
            </span>

            <span className="text-sm font-medium text-[var(--muted)]">{monthLabel}</span>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Total del mes</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
              ${totalMonth.toLocaleString("es-AR")}
            </p>
          </div>

          <p className="text-sm text-[var(--muted)] sm:text-base">
            Vence:{" "}
            <span className="font-semibold text-[var(--foreground)]">{dueDate}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
          <p className="text-sm font-medium text-[var(--muted)]">Alias para pagar</p>

          <div className="mt-3 space-y-3">
            <p className="break-all text-base font-semibold text-[var(--foreground)]">
              {alias || "-"}
            </p>

            {alias ? <CopyAliasButton alias={alias} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
};

type ConceptSummaryCardProps = {
  title: string;
  amount: number;
  description: string;
};

const ConceptSummaryCard = ({ title, amount, description }: ConceptSummaryCardProps) => {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
        ${amount.toLocaleString("es-AR")}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">{description}</p>
    </article>
  );
};

type FieldConceptSummaryCardProps = {
  totalAmount: number;
  totalFieldEvents: number;
};

const FieldConceptSummaryCard = ({
  totalAmount,
  totalFieldEvents,
}: FieldConceptSummaryCardProps) => {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">Canchas</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
        ${totalAmount.toLocaleString("es-AR")}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {totalFieldEvents} {totalFieldEvents === 1 ? "fecha" : "fechas"} en el mes.
      </p>
    </article>
  );
};
