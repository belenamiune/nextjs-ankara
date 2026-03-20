import { MonthCharge, Payment } from "@/types";

export function getChargeByCode(
  monthCharges: MonthCharge[],
  code: string
) {
  return monthCharges.find((charge) => charge.conceptCode === code);
}

export function getPaymentForPlayerAndCharge(
  payments: Payment[],
  playerId: number,
  monthChargeId?: number
) {
  if (!monthChargeId) return undefined;

  return payments.find(
    (payment) =>
      payment.playerId === playerId &&
      payment.monthChargeId === monthChargeId
  );
}

export function getTotalMonthAmount(monthCharges: MonthCharge[]) {
  return monthCharges.reduce((total, charge) => total + charge.amount, 0);
}