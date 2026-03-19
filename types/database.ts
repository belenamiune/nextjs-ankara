export type PlayerRow = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
};

export type MonthRow = {
  id: number;
  label: string;
  amount: number;
  due_date: string;
  alias: string;
  is_current: boolean;
  created_at: string;
};

export type PaymentRow = {
  id: number;
  player_id: number;
  month_id: number;
  paid: boolean;
  paid_at: string | null;
  amount_paid: number | null;
  notes: string | null;
  created_at: string;
};