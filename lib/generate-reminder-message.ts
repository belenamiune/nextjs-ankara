import { MonthConfig, Payment, Player } from "@/types";

export function generateReminderMessage(
  players: Player[],
  payments: Payment[],
  month: MonthConfig
) {
  const pendingPlayers = players.filter((player) => {
    if (!player.active) return false;

    const payment = payments.find((payment) => payment.playerId === player.id);

    return !payment?.paid;
  });

  const pendingNames = pendingPlayers.map((player) => player.name);

  if (pendingNames.length === 0) {
    return `Todas las jugadoras pagaron la cuota de ${month.label}.`;
  }

  return `Chicas, recuerden que la cuota de Ankara de ${month.label} es de $${month.amount} y vence el ${month.dueDate}. El alias para transferir es ${month.alias}. Pendientes: ${pendingNames.join(", ")}.`;
}