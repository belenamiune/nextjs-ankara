import {
  FieldEvent,
  FieldPayment,
  MonthConfig,
  MonthCharge,
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

export const adaptPlayer = (row: PlayerRow): Player => ({
  id: row.id,
  name: row.name,
  nickname: row.nickname ?? undefined,
  email: row.email ?? undefined,
  birthDate: row.birth_date ?? undefined,
  active: row.active,
});

export function adaptMonth(row: MonthRow): MonthConfig {
  return {
    id: row.id,
    label: row.label,
    dueDate: row.due_date,
    alias: row.alias,
  };
}

export function adaptMonthCharge(row: MonthChargeRow): MonthCharge {
  return {
    id: row.id,
    monthId: row.month_id,
    conceptId: row.concept_id,
    conceptCode: row.charge_concepts?.code ?? "",
    conceptName: row.charge_concepts?.name ?? "",
    amount: row.amount,
    alias: row.alias ?? undefined,
    paymentLink: row.payment_link ?? undefined,
    active: row.active,
  };
}

export function adaptPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    playerId: row.player_id,
    monthChargeId: row.month_charge_id,
    paid: row.paid,
    paidAt: row.paid_at ?? undefined,
    amountPaid: row.amount_paid ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function adaptFieldEvent(row: FieldEventRow): FieldEvent {
  return {
    id: row.id,
    monthId: row.month_id,
    eventDate: row.event_date,
    label: row.label,
    amount: row.amount,
    paymentLink: row.payment_link ?? undefined,
    active: row.active,
  };
}

export function adaptFieldPayment(row: FieldPaymentRow): FieldPayment {
  return {
    id: row.id,
    playerId: row.player_id,
    fieldEventId: row.field_event_id,
    paid: row.paid,
    paidAt: row.paid_at ?? undefined,
    amountPaid: row.amount_paid ?? undefined,
    notes: row.notes ?? undefined,
  };
}
