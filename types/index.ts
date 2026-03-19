export type Player = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  active: boolean;
};

export type MonthConfig = {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  alias: string;
};

export type Payment = {
  id: string;
  playerId: string;
  monthId: string;
  paid: boolean;
  paidAt?: string;
  amountPaid?: number;
  notes?: string;
};