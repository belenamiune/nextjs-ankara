export type Player = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  active: boolean;
};

export type MonthConfig = {
  id: number;
  label: string;
  dueDate: string;
  alias: string;
};

export type ChargeConcept = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};

export type MonthCharge = {
  id: number;
  monthId: number;
  conceptId: number;
  conceptCode: string;
  conceptName: string;
  amount: number;
  alias?: string;
  paymentLink?: string;
  active: boolean;
};

export type Payment = {
  id: number;
  playerId: number;
  monthChargeId: number;
  paid: boolean;
  paidAt?: string;
  amountPaid?: number;
  notes?: string;
};

export type FieldEvent = {
  id: number;
  monthId: number;
  eventDate: string;
  label: string;
  amount: number;
  paymentLink?: string;
  active: boolean;
};

export type FieldPayment = {
  id: number;
  playerId: number;
  fieldEventId: number;
  paid: boolean;
  paidAt?: string;
  amountPaid?: number;
  notes?: string;
};