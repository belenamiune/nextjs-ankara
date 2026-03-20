"use client";

import { useEffect, useState } from "react";
import AdminPaymentsPanel from "@/components/admin-payments-panel";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link  from "next/link";
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

export default function AdminPage() {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Admin
          </span>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Panel admin Ankara
            </h1>
            <p className="text-sm text-gray-500 sm:text-base">
              Gestioná pagos de profesor y canchas.
            </p>
          </div>
        </div>
          <PageModeSwitch href="/" label="Dashboard" dark />
      </header>

        <AdminPaymentsPanel
          players={players}
          initialPayments={payments}
          month={currentMonth}
          monthCharges={monthCharges}
          fieldEvents={fieldEvents}
          initialFieldPayments={fieldPayments}
        />
      </div>
    </main>
  );
}