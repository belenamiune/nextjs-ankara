"use client";

import { useEffect, useState } from "react";
import AdminPaymentsPanel from "@/components/admin-payments-panel";
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
        supabase.from("field_events").select("*").order("event_date", { ascending: true }),
        supabase.from("field_payments").select("*").order("id", { ascending: true }),
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
        ((fieldPaymentsResponse.data ?? []) as FieldPaymentRow[]).map(adaptFieldPayment)
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
        <header className="flex flex-col gap-2">
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