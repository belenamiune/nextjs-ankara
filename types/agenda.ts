export type AgendaPlayer = {
  id: number;
  name: string;
  nickname?: string;
  email?: string;
  birthDate?: string;
  active: boolean;
};

export type AgendaMatch = {
  id: number;
  roundNumber: number;
  opponent: string;
  matchDate: string;
  matchTime: string;
  fieldLabel: string;
  status: "upcoming" | "played";
  active: boolean;
};

export type PlayerAbsence = {
  id: number;
  playerId: number;
  matchId: number;
  reason?: string;
};