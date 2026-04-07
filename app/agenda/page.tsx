"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AppSectionNav from "@/components/app-section-nav";
import ThemeToggle from "@/components/theme-toggle";
import FullScreenLoader from "@/components/full-screen-loader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  adaptAgendaMatch,
  adaptAgendaPlayer,
  adaptPlayerAbsence,
} from "@/lib/agenda-adapters";
import { AgendaMatch, AgendaPlayer, PlayerAbsence } from "@/types/agenda";

export default function AgendaPage() {
  const [players, setPlayers] = useState<AgendaPlayer[]>([]);
  const [matches, setMatches] = useState<AgendaMatch[]>([]);
  const [absences, setAbsences] = useState<PlayerAbsence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendaData = async () => {
      const supabase = createBrowserSupabaseClient();

      const [playersResponse, matchesResponse, absencesResponse] = await Promise.all([
        supabase
          .from("players")
          .select("id, name, nickname, email, birth_date, active")
          .eq("active", true)
          .order("id", { ascending: true }),

        supabase
          .from("matches")
          .select(
            "id, round_number, opponent, match_date, match_time, field_label, status, active"
          )
          .eq("active", true)
          .order("match_date", { ascending: true }),

        supabase.from("player_absences").select("id, player_id, match_id, reason"),
      ]);

      if (playersResponse.error) console.error(playersResponse.error);
      if (matchesResponse.error) console.error(matchesResponse.error);
      if (absencesResponse.error) console.error(absencesResponse.error);

      setPlayers((playersResponse.data ?? []).map(adaptAgendaPlayer));
      setMatches((matchesResponse.data ?? []).map(adaptAgendaMatch));
      setAbsences((absencesResponse.data ?? []).map(adaptPlayerAbsence));
      setLoading(false);
    };

    fetchAgendaData();
  }, []);

  const nextMatch = useMemo(() => {
    return matches.find((match) => match.status === "upcoming");
  }, [matches]);

  const absentPlayersForNextMatch = useMemo(() => {
    if (!nextMatch) return [];

    const absentPlayerIds = absences
      .filter((absence) => absence.matchId === nextMatch.id)
      .map((absence) => absence.playerId);

    return players.filter((player) => absentPlayerIds.includes(player.id));
  }, [absences, nextMatch, players]);

  const upcomingBirthdays = useMemo(() => {
  const today = new Date();

  const withBirthdayDate = players
      .filter((player) => !!player.birthDate)
      .map((player) => {
        const [year, month, day] = (player.birthDate as string).split("-").map(Number);

        const nextBirthday = new Date(
          today.getFullYear(),
          month - 1,
          day
        );

        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        return {
          ...player,
          nextBirthday,
        };
      })
      .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());

    return withBirthdayDate.slice(0, 5);
  }, [players]);

  if (loading) {
    return <FullScreenLoader text="Cargando agenda" />;
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Logo Ankara"
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="w-fit rounded-full bg-[var(--surface-mint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ankara-blue)] ring-1 ring-[var(--ring)] dark:text-[var(--ankara-mint)]">
                  Agenda
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Agenda del equipo
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Próximas fechas, ausencias y cumpleaños.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 self-start sm:items-end">
              <ThemeToggle />
              <AppSectionNav />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Próximo partido
            </h2>

            {nextMatch ? (
              <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <p className="font-semibold text-[var(--foreground)]">
                  Fecha {nextMatch.roundNumber} · Ankara vs {nextMatch.opponent}
                </p>
                <p>{nextMatch.matchDate}</p>
                <p>{nextMatch.matchTime.slice(0, 5)} hs</p>
                <p>{nextMatch.fieldLabel}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                No hay próximo partido cargado.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Ausencias</h2>

            {nextMatch ? (
              absentPlayersForNextMatch.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                  {absentPlayersForNextMatch.map((player) => (
                    <li key={player.id}>• {player.nickname ?? player.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  No hay ausencias cargadas para la próxima fecha.
                </p>
              )
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Cargá un próximo partido para ver ausencias.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Próximos cumpleaños
            </h2>

            {upcomingBirthdays.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {upcomingBirthdays.map((player) => (
                  <li key={player.id}>
                    • {player.nickname ?? player.name} —{" "}
                    {player.nextBirthday.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">
                No hay cumpleaños cargados.
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
