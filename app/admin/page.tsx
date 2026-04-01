"use client";

import { useEffect, useState } from "react";
import AdminPaymentsPanel from "@/components/admin-payments-panel";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  adaptFieldEvent,
  adaptFieldPayment,
  adaptMonth,
  adaptMonthCharge,
  adaptPayment,
  adaptPlayer,
} from "@/lib/adapters";
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
import FullScreenLoader from "@/components/full-screen-loader";
import PageModeSwitch from "@/components/page-mode-switch";
import ThemeToggle from "@/components/theme-toggle";
import AdminMatchesPanel from "@/components/admin-matches-panel";
import { adaptMatch } from "@/lib/match-adapter";
import { Match } from "@/types/match";

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthConfig | null>(null);
  const [monthCharges, setMonthCharges] = useState<MonthCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fieldEvents, setFieldEvents] = useState<FieldEvent[]>([]);
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([]);
  const [loading, setLoading] = useState(true);
   const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserSupabaseClient();

      const matchesResponse = await supabase
        .from("matches")
        .select("*")
        .eq("active", true)
        .order("round_number", { ascending: true });

      if (matchesResponse.error) console.error(matchesResponse.error);

      setMatches((matchesResponse.data ?? []).map(adaptMatch));

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
                <span className="w-fit rounded-full bg-[var(--ankara-blue)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]">
                  Admin
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Panel admin Ankara
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Gestión de pagos, canchas y estado general del equipo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <ThemeToggle />
              <PageModeSwitch href="/" label="Dashboard" dark />
            </div>
          </div>
        </header>

        <AdminPaymentsPanel
          players={players}
          initialPayments={payments}
          month={currentMonth}
          monthCharges={monthCharges}
          fieldEvents={fieldEvents}
          initialFieldPayments={fieldPayments}
        />
        <AdminMatchesPanel initialMatches={matches} />
      </div>
    </main>
  );
}