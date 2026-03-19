import { Player, Payment } from "@/types";

export function paidCount(payments: Payment[]) {
  return payments.filter((payment) => payment.paid).length;
}

export function pendingCount(players: Player[], payments: Payment[]) {
  const activePlayers = players.filter((player) => player.active);
  const paidPlayers = payments.filter((payment) => payment.paid).length;

  return activePlayers.length - paidPlayers;
}

export function totalExpected(players: Player[], amount: number) {
  const activePlayers = players.filter((player) => player.active);

  return activePlayers.length * amount;
}

export function totalCollected(payments: Payment[]) {
  return payments
    .filter((payment) => payment.paid)
    .reduce((total, payment) => total + (payment.amountPaid ?? 0), 0);
}

export function getMonthSummary(
  players: Player[],
  payments: Payment[],
  amount: number
) {
  return {
    paidCount: paidCount(payments),
    pendingCount: pendingCount(players, payments),
    totalExpected: totalExpected(players, amount),
    totalCollected: totalCollected(payments),
  };
}

// para paid: si una jugadora paga parcial, o paga dos veces, esa lógica cambia.