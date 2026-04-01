"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import AppSectionNav from "@/components/app-section-nav";
import FullScreenLoader from "@/components/full-screen-loader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { adaptMatch } from "@/lib/match-adapter";
import { Match } from "@/types/match";

export default function StatsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const supabase = createBrowserSupabaseClient();

      const response = await supabase
        .from("matches")
        .select("*")
        .eq("active", true)
        .order("match_date", { ascending: true });

      if (response.error) {
        console.error(response.error);
        setLoading(false);
        return;
      }

      setMatches((response.data ?? []).map(adaptMatch));
      setLoading(false);
    };

    fetchMatches();
  }, []);

  const playedMatches = useMemo(() => {
    return matches.filter((match) => match.status === "played");
  }, [matches]);

  const upcomingMatches = useMemo(() => {
    return matches.filter((match) => match.status === "upcoming");
  }, [matches]);

  const stats = useMemo(() => {
    const played = playedMatches.length;
    const won = playedMatches.filter((match) => match.result === "won").length;
    const draw = playedMatches.filter((match) => match.result === "draw").length;
    const lost = playedMatches.filter((match) => match.result === "lost").length;

    const goalsFor = playedMatches.reduce(
      (total, match) => total + (match.ankaraGoals ?? 0),
      0
    );

    const goalsAgainst = playedMatches.reduce(
      (total, match) => total + (match.opponentGoals ?? 0),
      0
    );

    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + draw;

    return {
      played,
      won,
      draw,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
    };
  }, [playedMatches]);

  const lastMatch = useMemo(() => {
    if (playedMatches.length === 0) return null;
    return playedMatches[playedMatches.length - 1];
  }, [playedMatches]);

  const nextMatch = useMemo(() => {
    if (upcomingMatches.length === 0) return null;
    return upcomingMatches[0];
  }, [upcomingMatches]);

  if (loading) {
    return <FullScreenLoader text="Cargando stats" />;
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
                  Stats
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Stats de Ankara
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Rendimiento del equipo en el torneo.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Puntos" value={String(stats.points)} highlight />
          <SummaryCard label="Partidos jugados" value={String(stats.played)} />
          <SummaryCard label="Goles a favor" value={String(stats.goalsFor)} />
          <SummaryCard label="Diferencia de gol" value={String(stats.goalDifference)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Resumen general
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatItem label="PJ" value={stats.played} />
              <StatItem label="PG" value={stats.won} />
              <StatItem label="PE" value={stats.draw} />
              <StatItem label="PP" value={stats.lost} />
              <StatItem label="GF" value={stats.goalsFor} />
              <StatItem label="GC" value={stats.goalsAgainst} />
              <StatItem label="DG" value={stats.goalDifference} />
              <StatItem label="PTS" value={stats.points} />
            </div>
          </article>

          <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Partidos clave
            </h2>

            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-medium text-[var(--muted)]">
                  Último partido jugado
                </p>

                {lastMatch ? (
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-[var(--foreground)]">
                      Fecha {lastMatch.roundNumber} · Ankara vs {lastMatch.opponent}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {lastMatch.ankaraGoals} - {lastMatch.opponentGoals}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {lastMatch.matchDate} · {lastMatch.fieldLabel}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    No hay partidos jugados todavía.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-medium text-[var(--muted)]">Próximo partido</p>

                {nextMatch ? (
                  <div className="mt-2 space-y-1">
                    <p className="font-semibold text-[var(--foreground)]">
                      Fecha {nextMatch.roundNumber} · Ankara vs {nextMatch.opponent}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {nextMatch.matchDate} · {nextMatch.matchTime.slice(0, 5)} hs
                    </p>
                    <p className="text-sm text-[var(--muted)]">{nextMatch.fieldLabel}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    No hay próximos partidos cargados.
                  </p>
                )}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function SummaryCard({ label, value, highlight = false }: SummaryCardProps) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        highlight
          ? "border-[var(--ring)] bg-[var(--surface-mint)]"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </article>
  );
}

type StatItemProps = {
  label: string;
  value: number;
};

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
