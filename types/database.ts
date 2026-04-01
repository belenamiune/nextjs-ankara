export type PlayerRow = {
  id: number;
  name: string;
  nickname: string | null;
  email: string | null;
  birth_date: string | null;
  active: boolean;
};

export type MonthRow = {
  id: number;
  label: string;
  due_date: string;
  alias: string;
  is_current: boolean;
  created_at: string;
};

export type ChargeConceptRow = {
  id: number;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
};

export type MonthChargeRow = {
  id: number;
  month_id: number;
  concept_id: number;
  amount: number;
  alias: string | null;
  payment_link: string | null;
  active: boolean;
  created_at: string;
  charge_concepts?: {
    id: number;
    code: string;
    name: string;
    active: boolean;
  } | null;
};

export type PaymentRow = {
  id: number;
  player_id: number;
  month_charge_id: number;
  paid: boolean;
  paid_at: string | null;
  amount_paid: number | null;
  notes: string | null;
  created_at: string;
};

export type FieldEventRow = {
  id: number;
  month_id: number;
  event_date: string;
  label: string;
  amount: number;
  payment_link: string | null;
  active: boolean;
  created_at: string;
};

export type FieldPaymentRow = {
  id: number;
  player_id: number;
  field_event_id: number;
  paid: boolean;
  paid_at: string | null;
  amount_paid: number | null;
  notes: string | null;
  created_at: string;
};
