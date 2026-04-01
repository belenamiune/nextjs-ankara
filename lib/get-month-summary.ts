import { MonthCharge, Payment, Player } from "@/types";
import { getPaymentForPlayerAndCharge, getTotalMonthAmount } from "@/lib/charge-helpers";

type MonthSummaryParams = {
  players: Player[];
  payments: Payment[];
  monthCharges: MonthCharge[];
};

export function getMonthSummary({ players, payments, monthCharges }: MonthSummaryParams) {
  const activePlayers = players.filter((player) => player.active);
  const activeCharges = monthCharges.filter((charge) => charge.active);

  const paidCount = payments.filter((payment) => payment.paid).length;

  const totalExpected = activePlayers.length * getTotalMonthAmount(activeCharges);

  const totalCollected = payments
    .filter((payment) => payment.paid)
    .reduce((acc, payment) => acc + (payment.amountPaid ?? 0), 0);

  const fullyUpToDateCount = activePlayers.filter((player) => {
    return activeCharges.every((charge) => {
      const payment = getPaymentForPlayerAndCharge(payments, player.id, charge.id);
      return payment?.paid;
    });
  }).length;

  const pendingPlayersCount = activePlayers.length - fullyUpToDateCount;

  return {
    paidCount,
    pendingPlayersCount,
    totalExpected,
    totalCollected,
    totalMonthAmount: getTotalMonthAmount(activeCharges),
  };
}
