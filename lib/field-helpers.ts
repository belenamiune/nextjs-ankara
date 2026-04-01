import { FieldEvent, FieldPayment } from "@/types";

export function getActiveFieldEvents(fieldEvents: FieldEvent[]) {
  return fieldEvents.filter((event) => event.active);
}

export function getTotalFieldAmount(fieldEvents: FieldEvent[]) {
  return getActiveFieldEvents(fieldEvents).reduce(
    (total, event) => total + event.amount,
    0
  );
}

export function getFieldPaymentForPlayer(
  fieldPayments: FieldPayment[],
  playerId: number,
  fieldEventId: number
) {
  return fieldPayments.find(
    (payment) => payment.playerId === playerId && payment.fieldEventId === fieldEventId
  );
}

export function getPaidFieldEventsCountForPlayer(
  fieldPayments: FieldPayment[],
  playerId: number,
  fieldEvents: FieldEvent[]
) {
  return getActiveFieldEvents(fieldEvents).filter((event) => {
    const payment = getFieldPaymentForPlayer(fieldPayments, playerId, event.id);
    return payment?.paid;
  }).length;
}

export function getTotalFieldEventsCount(fieldEvents: FieldEvent[]) {
  return getActiveFieldEvents(fieldEvents).length;
}
