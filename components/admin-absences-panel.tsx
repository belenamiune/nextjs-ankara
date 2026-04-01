"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AgendaMatch, AgendaPlayer, PlayerAbsence } from "@/types/agenda";

type AdminAbsencesPanelProps = {
  players: AgendaPlayer[];
  matches: AgendaMatch[];
  initialAbsences: PlayerAbsence[];
};

export default function AdminAbsencesPanel({
  players,
  matches,
  initialAbsences,
}: AdminAbsencesPanelProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    matches.find((match) => match.status === "upcoming")?.id?.toString() ?? ""
  );
  const [absences, setAbsences] = useState<PlayerAbsence[]>(initialAbsences);
  const [savingPlayerId, setSavingPlayerId] = useState<number | null>(null);

  const upcomingMatches = matches.filter((match) => match.status === "upcoming");

  const selectedMatch = matches.find((match) => String(match.id) === selectedMatchId);

  const selectedAbsences = useMemo(() => {
    if (!selectedMatch) return [];
    return absences.filter((absence) => absence.matchId === selectedMatch.id);
  }, [absences, selectedMatch]);

  const isPlayerAbsent = (playerId: number) => {
    return selectedAbsences.some((absence) => absence.playerId === playerId);
  };

  const handleToggleAbsence = async (playerId: number) => {
    if (!selectedMatch) return;

    const supabase = createBrowserSupabaseClient();
    setSavingPlayerId(playerId);

    const existingAbsence = absences.find(
      (absence) => absence.playerId === playerId && absence.matchId === selectedMatch.id
    );

    if (existingAbsence) {
      const { error } = await supabase
        .from("player_absences")
        .delete()
        .eq("id", existingAbsence.id);

      if (error) {
        console.error(error);
        setSavingPlayerId(null);
        return;
      }

      setAbsences((prev) => prev.filter((absence) => absence.id !== existingAbsence.id));
      setSavingPlayerId(null);
      return;
    }

    const { data, error } = await supabase
      .from("player_absences")
      .insert({
        player_id: playerId,
        match_id: selectedMatch.id,
        reason: null,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      setSavingPlayerId(null);
      return;
    }

    setAbsences((prev) => [
      ...prev,
      {
        id: data.id,
        playerId: data.player_id,
        matchId: data.match_id,
        reason: data.reason ?? undefined,
      },
    ]);

    setSavingPlayerId(null);
  };

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
          Ausencias
        </h2>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Partido</span>

          <select
            value={selectedMatchId}
            onChange={(event) => setSelectedMatchId(event.target.value)}
            className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ankara-mint)]"
          >
            {upcomingMatches.map((match) => (
              <option key={match.id} value={match.id}>
                Fecha {match.roundNumber} · {match.opponent} · {match.matchDate}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => {
            const absent = isPlayerAbsent(player.id);

            return (
              <article
                key={player.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {player.nickname ?? player.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={savingPlayerId === player.id}
                    onClick={() => handleToggleAbsence(player.id)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                      absent
                        ? "bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400"
                        : "bg-[rgba(34,197,94,0.12)] text-green-700 dark:text-green-400"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {savingPlayerId === player.id
                      ? "Guardando..."
                      : absent
                        ? "Ausente"
                        : "Disponible"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
