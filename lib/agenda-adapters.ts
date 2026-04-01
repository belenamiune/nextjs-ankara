import { AgendaMatch, AgendaPlayer, PlayerAbsence } from "@/types/agenda";

type PlayerRow = {
  id: number;
  name: string;
  nickname: string | null;
  email: string | null;
  birth_date: string | null;
  active: boolean;
};

type MatchRow = {
  id: number;
  round_number: number;
  opponent: string;
  match_date: string;
  match_time: string;
  field_label: string;
  status: "upcoming" | "played";
  active: boolean;
};

type PlayerAbsenceRow = {
  id: number;
  player_id: number;
  match_id: number;
  reason: string | null;
};

export const adaptAgendaPlayer = (row: PlayerRow): AgendaPlayer => ({
  id: row.id,
  name: row.name,
  nickname: row.nickname ?? undefined,
  email: row.email ?? undefined,
  birthDate: row.birth_date ?? undefined,
  active: row.active,
});

export const adaptAgendaMatch = (row: MatchRow): AgendaMatch => ({
  id: row.id,
  roundNumber: row.round_number,
  opponent: row.opponent,
  matchDate: row.match_date,
  matchTime: row.match_time,
  fieldLabel: row.field_label,
  status: row.status,
  active: row.active,
});

export const adaptPlayerAbsence = (row: PlayerAbsenceRow): PlayerAbsence => ({
  id: row.id,
  playerId: row.player_id,
  matchId: row.match_id,
  reason: row.reason ?? undefined,
});
