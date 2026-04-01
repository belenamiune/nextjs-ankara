"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import AppSectionNav from "@/components/app-section-nav";
import FullScreenLoader from "@/components/full-screen-loader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getChargeByCode, getPaymentForPlayerAndCharge } from "@/lib/charge-helpers";
import {
  getPaidFieldEventsCountForPlayer,
  getTotalFieldEventsCount,
} from "@/lib/field-helpers";
import {
  adaptFieldEvent,
  adaptFieldPayment,
  adaptMonth,
  adaptMonthCharge,
  adaptPayment,
  adaptPlayer,
} from "@/lib/adapters";
import { PlayerSummary } from "@/types/player-summary";
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

export default function JugadorasPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthConfig | null>(null);
  const [monthCharges, setMonthCharges] = useState<MonthCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fieldEvents, setFieldEvents] = useState<FieldEvent[]>([]);
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const getSortableLastName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1
      ? parts[parts.length - 1].toLowerCase()
      : fullName.toLowerCase();
  };

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
    return <FullScreenLoader text="Cargando jugadoras" />;
  }

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFieldCount = getTotalFieldEventsCount(fieldEvents);

  const playerSummaries: PlayerSummary[] = players.map((player) => {
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

    const unpaidFieldEvents = fieldEvents.filter((event) => {
      const payment = fieldPayments.find(
        (fieldPayment) =>
          fieldPayment.playerId === player.id && fieldPayment.fieldEventId === event.id
      );

      return !payment?.paid;
    });

    const fieldDebt = unpaidFieldEvents.reduce((total, event) => total + event.amount, 0);
    const profesorDebt = profesorPayment?.paid ? 0 : (profesorCharge?.amount ?? 0);

    return {
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      email: player.email,
      birthDate: player.birthDate,
      active: player.active,
      profesorPaid: profesorPayment?.paid ?? false,
      profesorDebt,
      fieldPaidCount: paidFieldsCount,
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

  const activePlayers = sortedPlayerSummaries.filter((player) => player.active);

  const playersUpToDate = activePlayers.filter((player) => player.totalDebt === 0);

  const totalTeamDebt = activePlayers.reduce(
    (total, player) => total + player.totalDebt,
    0
  );

  const nextBirthdayPlayer = (() => {
    const today = new Date();

    const playersWithBirthday = activePlayers
      .filter((player) => !!player.birthDate)
      .map((player) => {
        const birthDate = new Date(player.birthDate as string);

        const nextBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );

        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        return {
          ...player,
          nextBirthday,
        };
      })
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());

    return playersWithBirthday[0];
  })();

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
                  Jugadoras
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Equipo Ankara
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Datos del equipo y deuda del mes actual.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Jugadoras activas" value={String(activePlayers.length)} />

          <SummaryCard
            label="Al día"
            value={`${playersUpToDate.length}/${activePlayers.length}`}
          />

          <SummaryCard
            label="Deuda total"
            value={`$${totalTeamDebt.toLocaleString("es-AR")}`}
            highlight
          />

          <SummaryCard
            label="Próximo cumpleaños"
            value={
              nextBirthdayPlayer
                ? `${nextBirthdayPlayer.nickname ?? nextBirthdayPlayer.name} · ${nextBirthdayPlayer.nextBirthday.toLocaleDateString(
                    "es-AR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                    }
                  )}`
                : "-"
            }
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedPlayerSummaries.map((player) => (
            <article
              key={player.id}
              className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    {player.nickname ?? player.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">{player.name}</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    player.active
                      ? "bg-[rgba(34,197,94,0.12)] text-green-700 dark:text-green-400"
                      : "bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400"
                  }`}
                >
                  {player.active ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <p>
                  <span className="font-medium text-[var(--foreground)]">Mail:</span>{" "}
                  {player.email ?? "-"}
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]">
                    Cumpleaños:
                  </span>{" "}
                  {player.birthDate ?? "-"}
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]">Zurdo:</span>{" "}
                  {player.profesorPaid ? "Pago" : "Pendiente"}
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]">Canchas:</span>{" "}
                  {player.fieldPaidCount}/{player.totalFieldCount} pagadas
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <DebtCard label="Debe Zurdo" amount={player.profesorDebt} />
                <DebtCard label="Debe canchas" amount={player.fieldDebt} />
                <DebtCard label="Debe total" amount={player.totalDebt} highlight />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
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
