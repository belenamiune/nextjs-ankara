import { MonthRow, PaymentRow, PlayerRow } from "@/types/database";
import { Player, MonthConfig, Payment } from "@/types";

export function adaptPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    active: row.active,
  };
}

export function adaptMonth(row: MonthRow): MonthConfig {
  return {
    id: row.id,
    label: row.label,
    amount: row.amount,
    dueDate: row.due_date,
    alias: row.alias,
  };
}

export function adaptPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    playerId: row.player_id,
    monthId: row.month_id,
    paid: row.paid,
    paidAt: row.paid_at ?? undefined,
    amountPaid: row.amount_paid ?? undefined,
    notes: row.notes ?? undefined,
  };
}