export type MatchStatus = "played" | "upcoming";
export type MatchResult = "won" | "lost" | "draw";

export type Match = {
  id: number;
  roundNumber: number;
  opponent: string;
  matchDate: string;
  matchTime: string;
  fieldLabel: string;
  status: MatchStatus;
  result?: MatchResult;
  ankaraGoals?: number;
  opponentGoals?: number;
  scorers: string[];
  photosUrl?: string;
  active: boolean;
};