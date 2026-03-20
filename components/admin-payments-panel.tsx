"use client";

import { useState } from "react";
import MonthlySummary from "@/components/monthly-summary";
import PaymentStatusBadge from "@/components/payment-status-badge";
import ReminderMessageBox from "@/components/reminder-message-box";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getChargeByCode, getPaymentForPlayerAndCharge } from "@/lib/charge-helpers";
import {
  getFieldPaymentForPlayer,
  getPaidFieldEventsCountForPlayer,
  getTotalFieldAmount,
  getTotalFieldEventsCount,
} from "@/lib/field-helpers";
import {
  FieldEvent,
  FieldPayment,
  MonthCharge,
  MonthConfig,
  Payment,
  Player,
} from "@/types";

type AdminPaymentsPanelProps = {
  players: Player[];
  initialPayments: Payment[];
  month: MonthConfig;
  monthCharges: MonthCharge[];
  fieldEvents: FieldEvent[];
  initialFieldPayments: FieldPayment[];
};

const AdminPaymentsPanel = ({
  players,
  initialPayments,
  month,
  monthCharges,
  fieldEvents,
  initialFieldPayments,
}: AdminPaymentsPanelProps) => {
  const [paymentsState, setPaymentsState] = useState(initialPayments);
  const [fieldPaymentsState, setFieldPaymentsState] = useState(initialFieldPayments);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFields = getTotalFieldAmount(fieldEvents);
  const totalMonth = (profesorCharge?.amount ?? 0) + totalFields;
  const totalFieldEvents = getTotalFieldEventsCount(fieldEvents);

  const handleToggleProfesor = async (playerId: number, monthChargeId: number) => {
    const supabase = createBrowserSupabaseClient();
    const key = `profesor-${playerId}-${monthChargeId}`;

    setSavingKey(key);
    setFeedbackKey(null);
    setErrorKey(null);

    const currentPayment = paymentsState.find(
      (payment) =>
        payment.playerId === playerId && payment.monthChargeId === monthChargeId
    );

    if (!currentPayment || !profesorCharge) {
      setSavingKey(null);
      setErrorKey(key);
      return;
    }

    const nextPaid = !currentPayment.paid;

    const { data, error } = await supabase
      .from("payments_v2")
      .update({
        paid: nextPaid,
        paid_at: nextPaid ? new Date().toISOString().split("T")[0] : null,
        amount_paid: nextPaid ? profesorCharge.amount : null,
      })
      .eq("id", currentPayment.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      setSavingKey(null);
      setErrorKey(key);
      return;
    }

    setPaymentsState((prev) =>
      prev.map((payment) =>
        payment.id === currentPayment.id
          ? {
              ...payment,
              paid: data.paid,
              paidAt: data.paid_at ?? undefined,
              amountPaid: data.amount_paid ?? undefined,
            }
          : payment
      )
    );

    setSavingKey(null);
    setFeedbackKey(key);

    setTimeout(() => {
      setFeedbackKey((current) => (current === key ? null : current));
    }, 2000);
  };

  const handleToggleField = async (playerId: number, fieldEventId: number) => {
    const supabase = createBrowserSupabaseClient();
    const key = `cancha-${playerId}-${fieldEventId}`;

    setSavingKey(key);
    setFeedbackKey(null);
    setErrorKey(null);

    const currentPayment = fieldPaymentsState.find(
      (payment) =>
        payment.playerId === playerId && payment.fieldEventId === fieldEventId
    );

    const currentEvent = fieldEvents.find((event) => event.id === fieldEventId);

    if (!currentPayment || !currentEvent) {
      setSavingKey(null);
      setErrorKey(key);
      return;
    }

    const nextPaid = !currentPayment.paid;

    const { data, error } = await supabase
      .from("field_payments")
      .update({
        paid: nextPaid,
        paid_at: nextPaid ? new Date().toISOString().split("T")[0] : null,
        amount_paid: nextPaid ? currentEvent.amount : null,
      })
      .eq("id", currentPayment.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      setSavingKey(null);
      setErrorKey(key);
      return;
    }

    setFieldPaymentsState((prev) =>
      prev.map((payment) =>
        payment.id === currentPayment.id
          ? {
              ...payment,
              paid: data.paid,
              paidAt: data.paid_at ?? undefined,
              amountPaid: data.amount_paid ?? undefined,
            }
          : payment
      )
    );

    setSavingKey(null);
    setFeedbackKey(key);

    setTimeout(() => {
      setFeedbackKey((current) => (current === key ? null : current));
    }, 2000);
  };

  const reminderMessage = players
    .filter((player) => player.active)
    .map((player) => {
      const profesorPayment = getPaymentForPlayerAndCharge(
        paymentsState,
        player.id,
        profesorCharge?.id
      );

      const pendingFields = fieldEvents.filter((event) => {
        const payment = getFieldPaymentForPlayer(
          fieldPaymentsState,
          player.id,
          event.id
        );
        return !payment?.paid;
      });

      const parts = [];
      if (!profesorPayment?.paid) parts.push("Profesor");
      if (pendingFields.length > 0) {
        parts.push(`Canchas (${pendingFields.length}/${totalFieldEvents} pendientes)`);
      }

      return parts.length > 0 ? `${player.name}: ${parts.join(", ")}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return (
    <section className="flex flex-col gap-6">
      <MonthlySummary month={month} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profesor"
          value={`$${(profesorCharge?.amount ?? 0).toLocaleString("es-AR")}`}
        />
        <StatCard
          label="Canchas del mes"
          value={`$${totalFields.toLocaleString("es-AR")}`}
        />
        <StatCard
          label="Total del mes"
          value={`$${totalMonth.toLocaleString("es-AR")}`}
        />
        <StatCard label="Domingos" value={String(totalFieldEvents)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Jugadoras
          </h2>
          <p className="text-sm text-gray-500">
            Profesor y detalle de canchas por jugadora.
          </p>
        </div>

        <div className="grid gap-4">
          {players.map((player) => {
            const profesorPayment = getPaymentForPlayerAndCharge(
              paymentsState,
              player.id,
              profesorCharge?.id
            );

            const paidFieldsCount = getPaidFieldEventsCountForPlayer(
              fieldPaymentsState,
              player.id,
              fieldEvents
            );

            return (
              <article
                key={player.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  {player.name}
                </h3>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Profesor
                      </span>
                      <PaymentStatusBadge paid={profesorPayment?.paid ?? false} />
                    </div>

                    <div className="mt-4">
                      <ActionButton
                        label={
                          profesorPayment?.paid
                            ? "Desmarcar pago"
                            : "Marcar como pago"
                        }
                        saving={savingKey === `profesor-${player.id}-${profesorCharge?.id}`}
                        saved={feedbackKey === `profesor-${player.id}-${profesorCharge?.id}`}
                        error={errorKey === `profesor-${player.id}-${profesorCharge?.id}`}
                        onClick={() =>
                          profesorCharge &&
                          handleToggleProfesor(player.id, profesorCharge.id)
                        }
                        active={!!profesorPayment?.paid}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Canchas
                      </span>
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                        {paidFieldsCount}/{totalFieldEvents} pagadas
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {fieldEvents.map((event) => {
                        const payment = getFieldPaymentForPlayer(
                          fieldPaymentsState,
                          player.id,
                          event.id
                        );

                        const actionKey = `cancha-${player.id}-${event.id}`;

                        return (
                          <div
                            key={event.id}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {event.label}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {event.eventDate} - ${event.amount.toLocaleString("es-AR")}
                                </p>
                              </div>

                              <PaymentStatusBadge paid={payment?.paid ?? false} />
                            </div>

                            <div className="mt-3">
                              <ActionButton
                                label={
                                  payment?.paid
                                    ? "Desmarcar pago"
                                    : "Marcar como pago"
                                }
                                saving={savingKey === actionKey}
                                saved={feedbackKey === actionKey}
                                error={errorKey === actionKey}
                                onClick={() => handleToggleField(player.id, event.id)}
                                active={!!payment?.paid}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <ReminderMessageBox
        message={
          reminderMessage ||
          `Todas las jugadoras están al día en ${month.label}.`
        }
      />
    </section>
  );
};

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

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  error: boolean;
  active: boolean;
};

const ActionButton = ({
  label,
  onClick,
  saving,
  saved,
  error,
  active,
}: ActionButtonProps) => {
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={onClick}
        disabled={saving}
        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition sm:w-auto ${
          active
            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
            : "bg-black text-white hover:opacity-90"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {saving ? "Guardando..." : label}
      </button>

      {saved && <p className="text-sm font-medium text-green-600">Guardado</p>}
      {error && <p className="text-sm font-medium text-red-600">Error al guardar</p>}
    </div>
  );
};

export default AdminPaymentsPanel;