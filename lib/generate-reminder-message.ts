import { MonthCharge, MonthConfig, Payment, Player } from "@/types";
import { getPaymentForPlayerAndCharge } from "@/lib/charge-helpers";

type ReminderMessageParams = {
  players: Player[];
  payments: Payment[];
  month: MonthConfig;
  monthCharges: MonthCharge[];
};

export function generateReminderMessage({
  players,
  payments,
  month,
  monthCharges,
}: ReminderMessageParams) {
  const pendingLines: string[] = [];

  players
    .filter((player) => player.active)
    .forEach((player) => {
      const pendingConcepts = monthCharges
        .filter((charge) => charge.active)
        .filter((charge) => {
          const payment = getPaymentForPlayerAndCharge(
            payments,
            player.id,
            charge.id
          );

          return !payment?.paid;
        })
        .map((charge) => charge.conceptName);

      if (pendingConcepts.length > 0) {
        pendingLines.push(`${player.name}: ${pendingConcepts.join(", ")}`);
      }
    });

  if (pendingLines.length === 0) {
    return `Todas las jugadoras pagaron los conceptos de ${month.label}.`;
  }

  return `Chicas, recuerden que los pagos de ${month.label} vencen el ${month.dueDate}. Alias: ${month.alias}. Pendientes:\n${pendingLines.join("\n")}`;
}