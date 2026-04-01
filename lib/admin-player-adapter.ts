import { AdminPlayer } from "@/types/admin-player";

type PlayerRow = {
  id: number;
  name: string;
  nickname: string | null;
  email: string | null;
  birth_date: string | null;
  active: boolean;
};

export const adaptAdminPlayer = (row: PlayerRow): AdminPlayer => ({
  id: row.id,
  name: row.name,
  nickname: row.nickname ?? undefined,
  email: row.email ?? undefined,
  birthDate: row.birth_date ?? undefined,
  active: row.active,
});