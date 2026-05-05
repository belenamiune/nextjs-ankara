"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import AppSectionNav from "@/components/app-section-nav";
import FullScreenLoader from "@/components/full-screen-loader";
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

type PlayerMonthSummary = {
  id: number;
  name: string;
  nickname?: string;
  profesorPaid: boolean;
  profesorDebt: number;
  fieldPaidCount: number;
  totalFieldCount: number;
  fieldDebt: number;
  totalDebt: number;
  active: boolean;
};

export default function HistorialPage() {
  const [months, setMonths] = useState<MonthConfig[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [monthCharges, setMonthCharges] = useState<MonthCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fieldEvents, setFieldEvents] = useState<FieldEvent[]>([]);
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);

  const getSortableLastName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : fullName.toLowerCase();
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createBrowserSupabaseClient();

      const monthsResponse = await supabase
        .from("months")
        .select("*")
        .order("due_date", { ascending: false });

      const playersResponse = await supabase
        .from("players")
        .select("*")
        .order("id", { ascending: true });

      if (monthsResponse.error) console.error(monthsResponse.error);
      if (playersResponse.error) console.error(playersResponse.error);

      const adaptedMonths = ((monthsResponse.data ?? []) as MonthRow[]).map(adaptMonth);
      setMonths(adaptedMonths);
      setPlayers(((playersResponse.data ?? []) as PlayerRow[]).map(adaptPlayer));

      if (adaptedMonths.length > 0) {
        setSelectedMonthId(String(adaptedMonths[0].id));
      }

      setLoading(false);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchMonthData = async () => {
      if (!selectedMonthId) return;

      setMonthLoading(true);

      const supabase = createBrowserSupabaseClient();
      const monthId = Number(selectedMonthId);

      const chargesResponse = await supabase
        .from("month_charges")
        .select("*, charge_concepts(*)")
        .eq("month_id", monthId)
        .order("id", { ascending: true });

      const fieldEventsResponse = await supabase
        .from("field_events")
        .select("*")
        .eq("month_id", monthId)
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

      setMonthLoading(false);
    };

    fetchMonthData();
  }, [selectedMonthId]);

  const selectedMonth = useMemo(() => {
    return months.find((month) => String(month.id) === selectedMonthId) ?? null;
  }, [months, selectedMonthId]);

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFieldsAmount = fieldEvents.reduce((sum, event) => sum + event.amount, 0);
  const totalFieldCount = fieldEvents.length;

  const activePlayers = players.filter((player) => player.active);

  const playerSummaries: PlayerMonthSummary[] = players.map((player) => {
    const profesorPayment = getPaymentForPlayerAndCharge(
      payments,
      player.id,
      profesorCharge?.id
    );

    const paidFieldPayments = fieldPayments.filter(
      (payment) =>
        payment.playerId === player.id &&
        payment.paid &&
        fieldEvents.some((event) => event.id === payment.fieldEventId)
    );

    const unpaidFieldEvents = fieldEvents.filter((event) => {
      const payment = fieldPayments.find(
        (fieldPayment) =>
          fieldPayment.playerId === player.id && fieldPayment.fieldEventId === event.id
      );

      return !payment?.paid;
    });

    const profesorDebt =
      player.active && !profesorPayment?.paid ? (profesorCharge?.amount ?? 0) : 0;

    const fieldDebt = player.active
      ? unpaidFieldEvents.reduce((total, event) => total + event.amount, 0)
      : 0;

    return {
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      active: player.active,
      profesorPaid: profesorPayment?.paid ?? false,
      profesorDebt,
      fieldPaidCount: paidFieldPayments.length,
      totalFieldCount,
      fieldDebt,
      totalDebt: profesorDebt + fieldDebt,
    };
  });

  const sortedPlayerSummaries = [...playerSummaries].sort((a, b) => {
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

  const expectedProfesorTotal = (profesorCharge?.amount ?? 0) * activePlayers.length;
  const expectedFieldsTotal = totalFieldsAmount * activePlayers.length;
  const expectedTotal = expectedProfesorTotal + expectedFieldsTotal;

  const collectedProfesorTotal = payments.reduce((total, payment) => {
    if (!payment.paid) return total;
    return total + (payment.amountPaid ?? 0);
  }, 0);

  const collectedFieldsTotal = fieldPayments.reduce((total, payment) => {
    if (!payment.paid) return total;
    return total + (payment.amountPaid ?? 0);
  }, 0);

  const collectedTotal = collectedProfesorTotal + collectedFieldsTotal;
  const pendingTotal = expectedTotal - collectedTotal;

  if (loading) {
    return <FullScreenLoader text="Cargando historial" />;
  }

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
                  Historial
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Historial de meses
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Resumen financiero y detalle por jugadora.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 self-start sm:items-end">
              <ThemeToggle />
              <AppSectionNav />
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <label className="grid gap-2 sm:max-w-sm">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Seleccionar mes
            </span>
            <select
              value={selectedMonthId}
              onChange={(event) => setSelectedMonthId(event.target.value)}
              disabled={monthLoading}
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ankara-mint)]"
            >
              {months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {!selectedMonth ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <p className="text-sm text-[var(--muted)]">No hay mes seleccionado.</p>
          </section>
        ) : monthLoading ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--ankara-blue)]" />
              <p className="text-sm text-[var(--muted)]">
                Cargando información del mes...
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Mes" value={selectedMonth.label} />
              <SummaryCard
                label="Total esperado"
                value={`$${expectedTotal.toLocaleString("es-AR")}`}
              />
              <SummaryCard
                label="Recaudado"
                value={`$${collectedTotal.toLocaleString("es-AR")}`}
              />
              <SummaryCard
                label="Pendiente"
                value={`$${pendingTotal.toLocaleString("es-AR")}`}
                highlight
              />
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                  Detalle por jugadora
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Estado financiero de {selectedMonth.label}.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sortedPlayerSummaries.map((player) => (
                  <article
                    key={player.id}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-[var(--foreground)]">
                        {player.nickname ?? player.name}
                      </h3> 
                      <p className="truncate text-sm text-[var(--muted)]">{player.name}</p>
                    </div>

                    {!player.active && (
                      <span className="inline-flex w-fit shrink-0 rounded-full bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400 px-3 py-1 text-xs font-semibold ">
                        Inactiva
                      </span>
                    )}
                  </div>

                    <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                      <p>
                        <span className="font-medium text-[var(--foreground)]">
                          Zurdo:
                        </span>{" "}
                        {player.active ? (player.profesorPaid ? "Pago" : "Pendiente") : "Inactiva"}
                      </p>
                      <p>
                        <span className="font-medium text-[var(--foreground)]">
                          Canchas:
                        </span>{" "}
                        {player.active ? `${player.fieldPaidCount}/${player.totalFieldCount} pagadas` : "Inactiva"}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <DebtCard label="Debe Zurdo" amount={player.profesorDebt} />
                      <DebtCard label="Debe canchas" amount={player.fieldDebt} />
                      <DebtCard label="Debe total" amount={player.totalDebt} highlight />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function SummaryCard({ label, value, highlight = false }: SummaryCardProps) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        highlight
          ? "border-[var(--ring)] bg-[var(--surface-mint)]"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </article>
  );
}

type DebtCardProps = {
  label: string;
  amount: number;
  highlight?: boolean;
};

function DebtCard({ label, amount, highlight = false }: DebtCardProps) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        highlight
          ? "border-[var(--ring)] bg-[var(--surface-mint)]"
          : "border-[var(--border)] bg-[var(--surface-soft)]"
      }`}
    >
      <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-base font-bold text-[var(--foreground)]">
        ${amount.toLocaleString("es-AR")}
      </p>
    </div>
  );
}
