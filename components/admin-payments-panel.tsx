"use client";

import { useMemo, useState } from "react";
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

const getSortableLastName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);

  return parts.length > 1
    ? parts[parts.length - 1].toLowerCase()
    : fullName.toLowerCase();
};

const sortPlayersByLastName = (players: Player[]) => {
  return [...players].sort((a, b) => {
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
  const [expandedPlayers, setExpandedPlayers] = useState<Record<number, boolean>>({});

  const sortedPlayers = useMemo(() => sortPlayersByLastName(players), [players]);

  const profesorCharge = getChargeByCode(monthCharges, "profesor");
  const totalFields = getTotalFieldAmount(fieldEvents);
  const totalMonth = (profesorCharge?.amount ?? 0) + totalFields;
  const totalFieldEvents = getTotalFieldEventsCount(fieldEvents);

  const activePlayers = sortedPlayers.filter((player) => player.active);

  const expectedProfesorTotal = (profesorCharge?.amount ?? 0) * activePlayers.length;
  const expectedFieldsTotal = totalFields * activePlayers.length;
  const expectedTotal = expectedProfesorTotal + expectedFieldsTotal;

  const togglePlayerExpanded = (playerId: number) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  const collectedProfesorTotal = paymentsState.reduce((total, payment) => {
    if (!payment.paid) return total;

    return total + (payment.amountPaid ?? 0);
  }, 0);

  const collectedFieldsTotal = fieldPaymentsState.reduce((total, payment) => {
    if (!payment.paid) return total;

    return total + (payment.amountPaid ?? 0);
  }, 0);

  const collectedTotal = collectedProfesorTotal + collectedFieldsTotal;
  const pendingTotal = expectedTotal - collectedTotal;

  const handleToggleProfesor = async (playerId: number, monthChargeId: number) => {
    const supabase = createBrowserSupabaseClient();
    const key = `cuota-${playerId}-${monthChargeId}`;

    setSavingKey(key);
    setFeedbackKey(null);
    setErrorKey(null);

    const currentPayment = paymentsState.find(
      (payment) =>
        payment.playerId === playerId && payment.monthChargeId === monthChargeId
    );

    if (!profesorCharge) {
      setSavingKey(null);
      setErrorKey(key);
      return;
    }

    if (!currentPayment) {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          player_id: playerId,
          month_charge_id: monthChargeId,
          paid: true,
          paid_at: new Date().toISOString().split("T")[0],
          amount_paid: profesorCharge.amount,
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error(error);
        setSavingKey(null);
        setErrorKey(key);
        return;
      }

      setPaymentsState((prev) => [
        ...prev,
        {
          id: data.id,
          playerId: data.player_id,
          monthChargeId: data.month_charge_id,
          paid: data.paid,
          paidAt: data.paid_at ?? undefined,
          amountPaid: data.amount_paid ?? undefined,
        },
      ]);

      setSavingKey(null);
      setFeedbackKey(key);

      setTimeout(() => {
        setFeedbackKey((current) => (current === key ? null : current));
      }, 2000);

      return;
    }

    const nextPaid = !currentPayment.paid;

    const { data, error } = await supabase
      .from("payments")
      .update({
        paid: nextPaid,
        paid_at: nextPaid ? new Date().toISOString().split("T")[0] : null,
        amount_paid: nextPaid ? profesorCharge.amount : null,
      })
      .eq("id", currentPayment.id)
      .select("*")
      .single();

    if (error || !data) {
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
      (payment) => payment.playerId === playerId && payment.fieldEventId === fieldEventId
    );

    const currentEvent = fieldEvents.find((event) => event.id === fieldEventId);

    if (!currentEvent) {
      setSavingKey(null);
      setErrorKey(key);
      return;
    }

    if (!currentPayment) {
      const { data, error } = await supabase
        .from("field_payments")
        .insert({
          player_id: playerId,
          field_event_id: fieldEventId,
          paid: true,
          paid_at: new Date().toISOString().split("T")[0],
          amount_paid: currentEvent.amount,
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error(error);
        setSavingKey(null);
        setErrorKey(key);
        return;
      }

      setFieldPaymentsState((prev) => [
        ...prev,
        {
          id: data.id,
          playerId: data.player_id,
          fieldEventId: data.field_event_id,
          paid: data.paid,
          paidAt: data.paid_at ?? undefined,
          amountPaid: data.amount_paid ?? undefined,
        },
      ]);

      setSavingKey(null);
      setFeedbackKey(key);

      setTimeout(() => {
        setFeedbackKey((current) => (current === key ? null : current));
      }, 2000);

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
      .select("*")
      .single();

    if (error || !data) {
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

  const pendingPlayersLines = sortedPlayers
    .filter((player) => player.active)
    .map((player) => {
      const profesorPayment = getPaymentForPlayerAndCharge(
        paymentsState,
        player.id,
        profesorCharge?.id
      );

      const pendingFields = fieldEvents.filter((event) => {
        const payment = getFieldPaymentForPlayer(fieldPaymentsState, player.id, event.id);

        return !payment?.paid;
      });

      const parts: string[] = [];

      if (!profesorPayment?.paid) {
        parts.push("cuota pendiente");
      }

      if (pendingFields.length > 0) {
        const label =
          pendingFields.length === 1
            ? "1 cancha pendiente"
            : `${pendingFields.length} canchas pendientes`;

        parts.push(label);
      }

      if (parts.length === 0) return null;

      return `- ${player.name}: ${parts.join(" y ")}`;
    })
    .filter(Boolean);

  const reminderMessage =
    pendingPlayersLines.length > 0
      ? `Hola ankaritas, les paso lo pendiente de ${month.label}:\n\n${pendingPlayersLines.join(
          "\n"
        )}\n\nPor favor, cuando vayan pagando avísenme así lo actualizo. Gracias 💙`
      : `Todas las jugadoras están al día en ${month.label}. 💙`;

  return (
    <section className="flex flex-col gap-6">
      <MonthlySummary month={month} totalFieldEvents={totalFieldEvents} />

      <section className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Zurdo"
            value={`$${(profesorCharge?.amount ?? 0).toLocaleString("es-AR")}`}
            variant="default"
          />

          <StatCard
            label="Canchas del mes"
            value={`$${totalFields.toLocaleString("es-AR")}`}
            variant="mint"
          />

          <StatCard
            label="Total del mes"
            value={`$${totalMonth.toLocaleString("es-AR")}`}
            variant="blue"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total esperado"
            value={`$${expectedTotal.toLocaleString("es-AR")}`}
            variant="default"
          />

          <StatCard
            label="Total recaudado"
            value={`$${collectedTotal.toLocaleString("es-AR")}`}
            variant="success"
          />

          <StatCard
            label="Pendiente"
            value={`$${pendingTotal.toLocaleString("es-AR")}`}
            variant="warning"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            Jugadoras
          </h2>

          <p className="text-sm text-[var(--muted)]">
            Cuota y detalle de canchas por jugadora.
          </p>
        </div>

        <div className="grid gap-4">
          {sortedPlayers.map((player) => {
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

            const isExpanded = !!expandedPlayers[player.id];

            return (
              <article
                key={player.id}
                className={`rounded-3xl border p-4 shadow-sm transition-all duration-200 ${
                  player.active
                    ? "border-[var(--border)] bg-[var(--card)] hover:-translate-y-0.5"
                    : "border-[var(--border)] bg-[var(--surface-soft)] opacity-60 saturate-50"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
                      {player.name}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                      <span>
                        Zurdo:{" "}
                        {player.active
                          ? profesorPayment?.paid
                            ? "Pago"
                            : "Pendiente"
                          : "Inactiva"}
                      </span>

                      <span>·</span>

                      <span>
                        Canchas:{" "}
                        {player.active
                          ? `${paidFieldsCount}/${totalFieldEvents}`
                          : "Inactiva"}
                      </span>

                      {!player.active && (
                        <span className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                          Inactiva
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!player.active}
                    onClick={() => togglePlayerExpanded(player.id)}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--ankara-mint)] hover:bg-[var(--surface-mint)] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                  >
                    {player.active
                      ? isExpanded
                        ? "Ocultar detalle"
                        : "Ver detalle"
                      : "Inactiva"}
                  </button>
                </div>

                {player.active && isExpanded && (
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          Zurdo
                        </span>

                        <PaymentStatusBadge paid={profesorPayment?.paid ?? false} />
                      </div>

                      <div className="mt-4">
                        <ActionButton
                          label={
                            profesorPayment?.paid ? "Desmarcar pago" : "Marcar como pago"
                          }
                          saving={
                            savingKey === `cuota-${player.id}-${profesorCharge?.id}`
                          }
                          saved={
                            feedbackKey === `cuota-${player.id}-${profesorCharge?.id}`
                          }
                          error={errorKey === `cuota-${player.id}-${profesorCharge?.id}`}
                          onClick={() =>
                            profesorCharge &&
                            handleToggleProfesor(player.id, profesorCharge.id)
                          }
                          active={!!profesorPayment?.paid}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          Canchas
                        </span>

                        <span className="inline-flex w-fit rounded-full bg-[var(--surface-blue)] px-3 py-1 text-xs font-semibold text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]">
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
                              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[var(--foreground)]">
                                    {event.label}
                                  </p>

                                  <p className="text-xs text-[var(--muted)]">
                                    {event.eventDate} · $
                                    {event.amount.toLocaleString("es-AR")}
                                  </p>
                                </div>

                                <PaymentStatusBadge paid={payment?.paid ?? false} />
                              </div>

                              <div className="mt-3">
                                <ActionButton
                                  label={
                                    payment?.paid ? "Desmarcar pago" : "Marcar como pago"
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
                )}
              </article>
            );
          })}
        </div>
      </section>

      <ReminderMessageBox
        message={reminderMessage || `Todas las jugadoras están al día en ${month.label}.`}
      />
    </section>
  );
};

type StatCardProps = {
  label: string;
  value: string;
  variant?: "default" | "mint" | "blue" | "success" | "warning";
};

const StatCard = ({ label, value, variant = "default" }: StatCardProps) => {
  const variants = {
    default: "bg-[var(--card)] text-[var(--foreground)]",
    mint: "bg-[var(--surface-mint)] text-[var(--foreground)]",
    blue: "bg-[var(--surface-blue)] text-[var(--foreground)]",
    success: "bg-[rgba(34,197,94,0.10)] text-[var(--foreground)]",
    warning: "bg-[rgba(245,158,11,0.12)] text-[var(--foreground)]",
  };

  return (
    <article
      className={`rounded-3xl border border-[var(--border)] p-5 shadow-sm sm:p-6 ${variants[variant]}`}
    >
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>

      <p className="mt-3 break-words text-2xl font-bold leading-tight tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-3xl">
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
            ? "border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:bg-[var(--surface-blue)]"
            : "bg-[var(--ankara-blue)] text-white hover:opacity-90 dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {saving ? "Guardando" : label}
      </button>

      {saved && <p className="text-sm font-medium text-green-600">Guardado</p>}

      {error && <p className="text-sm font-medium text-red-600">Error al guardar</p>}
    </div>
  );
};

export default AdminPaymentsPanel;
