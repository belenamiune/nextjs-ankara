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
  amount: number;
  dueDate: string;
  alias: string;
};

export type Payment = {
  id: number;
  playerId: number;
  monthId: number;
  paid: boolean;
  paidAt?: string;
  amountPaid?: number;
  notes?: string;
};