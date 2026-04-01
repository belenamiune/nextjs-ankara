export type PlayerSummary = {
  id: number;
  name: string;
  nickname?: string;
  email?: string;
  birthDate?: string;
  active: boolean;
  profesorPaid: boolean;
  profesorDebt: number;
  fieldPaidCount: number;
  totalFieldCount: number;
  fieldDebt: number;
  totalDebt: number;
};
