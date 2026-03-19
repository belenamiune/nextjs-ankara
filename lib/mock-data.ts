export const players = [
  { id: "1", name: "Any", active: true },
  { id: "2", name: "Belu", active: true },
  { id: "3", name: "Pauli", active: true },
  { id: "4", name: "Sama", active: true },
  { id: "5", name: "Yani", active: true },
  { id: "6", name: "Fiore", active: true },
  { id: "7", name: "Anita", active: true },
  { id: "8", name: "Coti", active: true },
  { id: "9", name: "Priscila", active: true },
  { id: "10", name: "Pía", active: true },
  { id: "11", name: "Caro", active: true },
]

export const currentMonth = {
  id: "2026-03",
  label: "Marzo 2026",
  amount: 13000,
  dueDate: "2026-03-10",
  alias: "TU_ALIAS",
};

export const payments = [ // luego manejar diferentes estados de paid en lugar de booleanos
  {
    id: "pay-1",
    playerId: "1",
    monthId: "2026-03",
    paid: true,
    paidAt: "2026-03-03",
    amountPaid: 13000,
  },
  {
    id: "pay-2",
    playerId: "2",
    monthId: "2026-03",
    paid: true,
    paidAt: "2026-03-04",
    amountPaid: 13000,
  },
  {
    id: "pay-3",
    playerId: "3",
    monthId: "2026-03",
    paid: false,
  },
];