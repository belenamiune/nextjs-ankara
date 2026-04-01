import { Match, MatchResult, MatchStatus } from "@/types/match";

type MatchRow = {
  id: number;
  round_number: number;
  opponent: string;
  match_date: string;
  match_time: string;
  field_label: string;
  status: string;
  result: string | null;
  ankara_goals: number | null;
  opponent_goals: number | null;
  scorers: string[] | null;
  photos_url: string | null;
  active: boolean;
};

export const adaptMatch = (row: MatchRow): Match => {
  return {
    id: row.id,
    roundNumber: row.round_number,
    opponent: row.opponent,
    matchDate: row.match_date,
    matchTime: row.match_time,
    fieldLabel: row.field_label,
    status: row.status as MatchStatus,
    result: (row.result ?? undefined) as MatchResult | undefined,
    ankaraGoals: row.ankara_goals ?? undefined,
    opponentGoals: row.opponent_goals ?? undefined,
    scorers: row.scorers ?? [],
    photosUrl: row.photos_url ?? undefined,
    active: row.active,
  };
};
