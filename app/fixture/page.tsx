"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import AppSectionNav from "@/components/app-section-nav";
import FullScreenLoader from "@/components/full-screen-loader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { adaptMatch } from "@/lib/match-adapter";
import { Match } from "@/types/match";

const resultLabelMap = {
  won: "Ganado",
  lost: "Perdido",
  draw: "Empatado",
};

const resultClassMap = {
  won: "bg-[rgba(34,197,94,0.12)] text-green-700 dark:text-green-400",
  lost: "bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400",
  draw: "bg-[rgba(245,158,11,0.12)] text-amber-700 dark:text-amber-400",
};

export default function FixturePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      const supabase = createBrowserSupabaseClient();

      const response = await supabase
        .from("matches")
        .select("*")
        .eq("active", true)
        .order("round_number", { ascending: true });

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

  if (loading) {
    return <FullScreenLoader text="Cargando fixture" />;
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
                  Fixture
                </span>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-4xl">
                    Torneo Apertura Septen 2026
                  </h1>
                  <p className="text-sm text-[var(--muted)] sm:text-base">
                    Zona B · Resultados, próximas fechas y fotos.
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

        <section className="grid gap-4">
          {matches.map((match) => {
            const isPlayed = match.status === "played";
            const result = match.result;

            return (
              <article
                key={match.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--muted)]">
                        Fecha {match.roundNumber}
                      </p>
                      <h2 className="text-xl font-bold text-[var(--foreground)]">
                        Ankara vs {match.opponent}
                      </h2>
                    </div>

                    {isPlayed && result ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${resultClassMap[result]}`}
                      >
                        {resultLabelMap[result]}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--surface-blue)] px-3 py-1 text-xs font-semibold text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]">
                        Próximo partido
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 shadow-sm">
                        <Image
                          src="/logo.png"
                          alt="Logo Ankara"
                          width={56}
                          height={56}
                          className="h-14 w-14 object-contain"
                        />
                      </div>

                      <div>
                        <p className="text-base font-semibold text-[var(--foreground)]">
                          Ankara
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      {isPlayed ? (
                        <p className="text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
                          {match.ankaraGoals} - {match.opponentGoals}
                        </p>
                      ) : (
                        <p className="text-lg font-semibold text-[var(--muted)]">vs</p>
                      )}
                    </div>

                    <div className="flex items-center justify-start gap-3 md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-base font-semibold text-[var(--foreground)]">
                          {match.opponent}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 shadow-sm">
                        <Image
                          src="/rival-placeholder.png"
                          alt={`Logo ${match.opponent}`}
                          width={56}
                          height={56}
                          className="h-14 w-14 object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)] sm:grid-cols-3">
                    <p>{match.matchDate}</p>
                    <p>{match.matchTime.slice(0, 5)} hs</p>
                    <p>{match.fieldLabel}</p>
                  </div>

                  {isPlayed && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          Goles
                        </p>

                        {match.scorers.length > 0 ? (
                          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                            {match.scorers.map((scorer) => (
                              <li key={scorer}>• {scorer}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--muted)]">
                            Sin datos cargados.
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          Fotos de la fecha
                        </p>

                        {match.photosUrl ? (
                          <Link
                            href={match.photosUrl}
                            target="_blank"
                            className="mt-3 inline-block text-sm font-medium text-[var(--ankara-blue)] underline underline-offset-4"
                          >
                            Ver fotos
                          </Link>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--muted)]">
                            Todavía no está disponible.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
