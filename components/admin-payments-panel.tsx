"use client";

import { useState } from "react";
import PaymentStatusBadge from "@/components/payment-status-badge";
import ReminderMessageBox from "@/components/reminder-message-box";
import MonthlySummary from "@/components/monthly-summary";
import { generateReminderMessage } from "@/lib/generate-reminder-message";
import { getMonthSummary } from "@/lib/get-month-summary";
import { MonthConfig, Payment, Player } from "@/types";

type AdminPaymentsPanelProps = {
  players: Player[];
  initialPayments: Payment[];
  month: MonthConfig;
};

const AdminPaymentsPanel = ({
  players,
  initialPayments,
  month,
}: AdminPaymentsPanelProps) => {
  const [paymentsState, setPaymentsState] = useState(initialPayments);

  const summary = getMonthSummary(players, paymentsState, month.amount);
  const reminderMessage = generateReminderMessage(players, paymentsState, month);

  const handleTogglePayment = (playerId: string) => {
    setPaymentsState((prevPayments) =>
      prevPayments.map((payment) => {
        if (payment.playerId !== playerId) return payment;

        if (payment.paid) {
          return {
            ...payment,
            paid: false,
            paidAt: undefined,
            amountPaid: undefined,
          };
        }

        return {
          ...payment,
          paid: true,
          paidAt: new Date().toISOString().split("T")[0],
          amountPaid: month.amount,
        };
      })
    );
  };

  return (
    <section className="flex flex-col gap-6">
      <MonthlySummary month={month} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pagaron" value={String(summary.paidCount)} />
        <StatCard label="Pendientes" value={String(summary.pendingCount)} />
        <StatCard
          label="Total esperado"
          value={`$${summary.totalExpected.toLocaleString("es-AR")}`}
        />
        <StatCard
          label="Total cobrado"
          value={`$${summary.totalCollected.toLocaleString("es-AR")}`}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Jugadoras
          </h2>
          <p className="text-sm text-gray-500">
            Estado actual de pagos del mes y acciones rápidas.
          </p>
        </div>

        <div className="grid gap-4">
          {players.map((player) => {
            const payment = paymentsState.find(
              (payment) => payment.playerId === player.id
            );

            return (
              <article
                key={player.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                          {player.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID jugadora: {player.id}
                        </p>
                      </div>

                      <div className="self-start sm:self-auto">
                        <PaymentStatusBadge paid={payment?.paid ?? false} />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <InfoItem
                        label="Fecha de pago"
                        value={payment?.paidAt ?? "-"}
                      />
                      <InfoItem
                        label="Monto pagado"
                        value={
                          payment?.amountPaid
                            ? `$${payment.amountPaid.toLocaleString("es-AR")}`
                            : "-"
                        }
                      />
                      <InfoItem
                        label="Acción disponible"
                        value={payment?.paid ? "Desmarcar pago" : "Marcar pago"}
                      />
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 lg:w-auto">
                    <button
                      onClick={() => handleTogglePayment(player.id)}
                      className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition sm:w-auto ${
                        payment?.paid
                          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          : "bg-black text-white hover:opacity-90"
                      }`}
                    >
                      {payment?.paid ? "Desmarcar pago" : "Marcar como pagó"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <ReminderMessageBox message={reminderMessage} />
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

type InfoItemProps = {
  label: string;
  value: string;
};

const InfoItem = ({ label, value }: InfoItemProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
};

export default AdminPaymentsPanel;