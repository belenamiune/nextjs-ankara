"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPaymentsPanel from "@/components/admin-payments-panel";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  adaptFieldEvent,
  adaptFieldPayment,
  adaptMonth,
  adaptMonthCharge,
  adaptPayment,
  adaptPlayer,
} from "@/lib/adapters";
import {
  FieldEvent,
  FieldPayment,
  MonthCharge,
  MonthConfig,
  Payment,
  Player,
} from "@/types";
import {
  FieldEventRow,
  FieldPaymentRow,
  MonthChargeRow,
  MonthRow,
  PaymentRow,
  PlayerRow,
} from "@/types/database";
import FullScreenLoader from "@/components/full-screen-loader";
import PageModeSwitch from "@/components/page-mode-switch";
import ThemeToggle from "@/components/theme-toggle";
import AdminMatchesPanel from "@/components/admin-matches-panel";
import { adaptMatch } from "@/lib/match-adapter";
import { Match } from "@/types/match";
import { AgendaMatch, AgendaPlayer, PlayerAbsence } from "@/types/agenda";
import {
  adaptAgendaMatch,
  adaptAgendaPlayer,
  adaptPlayerAbsence,
} from "@/lib/agenda-adapters";
import AdminAbsencesPanel from "@/components/admin-absences-panel";
import { adaptAdminPlayer } from "@/lib/admin-player-adapter";
import { AdminPlayer } from "@/types/admin-player";
import AdminPlayersPanel from "@/components/admin-players-panel";

type AdminSection = "payments" | "matches" | "absences" | "players";

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthConfig | null>(null);
  const [monthCharges, setMonthCharges] = useState<MonthCharge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fieldEvents, setFieldEvents] = useState<FieldEvent[]>([]);
  const [fieldPayments, setFieldPayments] = useState<FieldPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [matches, setMatches] = useState<Match[]>([]);
  const [agendaPlayers, setAgendaPlayers] = useState<AgendaPlayer[]>([]);
  const [agendaMatches, setAgendaMatches] = useState<AgendaMatch[]>([]);
  const [playerAbsences, setPlayerAbsences] = useState<PlayerAbsence[]>([]);
  const [adminPlayers, setAdminPlayers] = useState<AdminPlayer[]>([]);

  const [activeSection, setActiveSection] = useState<AdminSection>("payments");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserSupabaseClient();

      const adminPlayersResponse = await supabase
        .from("players")
        .select("id, name, nickname, email, birth_date, active")
        .order("id", { ascending: true });

      if (adminPlayersResponse.error) {
        console.error(adminPlayersResponse.error);
      }

      setAdminPlayers((adminPlayersResponse.data ?? []).map(adaptAdminPlayer));

      const matchesResponse = await supabase
        .from("matches")
        .select("*")
        .eq("active", true)
        .order("round_number", { ascending: true });

      if (matchesResponse.error) {
        console.error(matchesResponse.error);
      }

      setMatches((matchesResponse.data ?? []).map(adaptMatch));

      const agendaPlayersResponse = await supabase
        .from("players")
        .select("id, name, nickname, email, birth_date, active")
        .eq("active", true)
        .order("id", { ascending: true });

      const agendaMatchesResponse = await supabase
        .from("matches")
        .select(
          "id, round_number, opponent, match_date, match_time, field_label, status, active"
        )
        .eq("active", true)
        .order("match_date", { ascending: true });

      const playerAbsencesResponse = await supabase
        .from("player_absences")
        .select("id, player_id, match_id, reason");

      if (agendaPlayersResponse.error) {
        console.error(agendaPlayersResponse.error);
      }

      if (agendaMatchesResponse.error) {
        console.error(agendaMatchesResponse.error);
      }

      if (playerAbsencesResponse.error) {
        console.error(playerAbsencesResponse.error);
      }

      setAgendaPlayers((agendaPlayersResponse.data ?? []).map(adaptAgendaPlayer));
      setAgendaMatches((agendaMatchesResponse.data ?? []).map(adaptAgendaMatch));
      setPlayerAbsences((playerAbsencesResponse.data ?? []).map(adaptPlayerAbsence));

      const playersResponse = await supabase
        .from("players")
        .select("*")
        .order("id", { ascending: true });

      const monthResponse = await supabase
        .from("months")
        .select("*")
        .eq("is_current", true)
        .single();

      if (playersResponse.error) {
        console.error(playersResponse.error);
      }

      if (monthResponse.error || !monthResponse.data) {
        console.error(monthResponse.error);
        setLoading(false);
        return;
      }

      const currentMonthId = monthResponse.data.id;

      const chargesResponse = await supabase
        .from("month_charges")
        .select("*, charge_concepts(*)")
        .eq("month_id", currentMonthId)
        .order("id", { ascending: true });

      const fieldEventsResponse = await supabase
        .from("field_events")
        .select("*")
        .eq("month_id", currentMonthId)
        .order("event_date", { ascending: true });

      if (chargesResponse.error) {
        console.error(chargesResponse.error);
      }

      if (fieldEventsResponse.error) {
        console.error(fieldEventsResponse.error);
      }

      const monthChargeIds = (chargesResponse.data ?? []).map((charge) => charge.id);
      const fieldEventIds = (fieldEventsResponse.data ?? []).map((event) => event.id);

      const paymentsResponse = monthChargeIds.length
        ? await supabase
            .from("payments")
            .select("*")
            .in("month_charge_id", monthChargeIds)
            .order("id", { ascending: true })
        : { data: [], error: null };

      const fieldPaymentsResponse = fieldEventIds.length
        ? await supabase
            .from("field_payments")
            .select("*")
            .in("field_event_id", fieldEventIds)
            .order("id", { ascending: true })
        : { data: [], error: null };

      if (paymentsResponse.error) {
        console.error(paymentsResponse.error);
      }

      if (fieldPaymentsResponse.error) {
        console.error(fieldPaymentsResponse.error);
      }

      setPlayers(((playersResponse.data ?? []) as PlayerRow[]).map(adaptPlayer));
      setCurrentMonth(adaptMonth(monthResponse.data as MonthRow));
      setMonthCharges(
        ((chargesResponse.data ?? []) as MonthChargeRow[]).map(adaptMonthCharge)
      );
      setPayments(((paymentsResponse.data ?? []) as PaymentRow[]).map(adaptPayment));
      setFieldEvents(
        ((fieldEventsResponse.data ?? []) as FieldEventRow[]).map(adaptFieldEvent)
      );
      setFieldPayments(
        ((fieldPaymentsResponse.data ?? []) as FieldPaymentRow[]).map(adaptFieldPayment)
      );

      setLoading(false);
    };

    fetchData();
  }, []);

  const summary = useMemo(() => {
    const activePlayersCount = adminPlayers.filter((player) => player.active).length;

    const paidPaymentsCount = payments.filter((payment) => payment.paid).length;
    const pendingPaymentsCount = payments.length - paidPaymentsCount;

    const upcomingMatchesCount = matches.length;
    const absencesCount = playerAbsences.length;

    return {
      activePlayersCount,
      paidPaymentsCount,
      pendingPaymentsCount,
      upcomingMatchesCount,
      absencesCount,
    };
  }, [adminPlayers, payments, matches, playerAbsences]);

  if (loading || !currentMonth) {
    return <FullScreenLoader text="Cargando" />;
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

              <div className="space-y-1">
                <span className="inline-flex w-fit rounded-full bg-[var(--ankara-blue)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]">
                  Admin
                </span>

                <h1 className="text-2xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white sm:text-3xl">
                  Panel admin Ankara
                </h1>

                <p className="text-sm text-[var(--muted)] sm:text-base">
                  Gestión de pagos, partidos, ausencias y jugadoras.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <ThemeToggle />
              <PageModeSwitch href="/" label="Dashboard" dark />
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Pagos pendientes"
            value={summary.pendingPaymentsCount}
            detail="Registros del mes actual"
          />

          <SummaryCard
            title="Pagos realizados"
            value={summary.paidPaymentsCount}
            detail="Marcados como pagos"
          />

          <SummaryCard
            title="Partidos"
            value={summary.upcomingMatchesCount}
            detail="Partidos activos cargados"
          />

          <SummaryCard
            title="Jugadoras activas"
            value={summary.activePlayersCount}
            detail={`Ausencias registradas: ${summary.absencesCount}`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm h-fit lg:sticky lg:top-6">
            <div className="mb-3 px-2 pt-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Secciones</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Seleccioná que querés administrar.
              </p>
            </div>

            <nav className="flex flex-col gap-2">
              <AdminNavButton
                label="Pagos"
                description="Pagos del mes y canchas"
                isActive={activeSection === "payments"}
                onClick={() => setActiveSection("payments")}
              />

              <AdminNavButton
                label="Partidos"
                description="Fixture y gestión de fechas"
                isActive={activeSection === "matches"}
                onClick={() => setActiveSection("matches")}
              />

              <AdminNavButton
                label="Ausencias"
                description="Disponibilidad de jugadoras"
                isActive={activeSection === "absences"}
                onClick={() => setActiveSection("absences")}
              />

              <AdminNavButton
                label="Jugadoras"
                description="Altas, bajas y edición"
                isActive={activeSection === "players"}
                onClick={() => setActiveSection("players")}
              />
            </nav>
          </aside>

          <section className="min-w-0">
            {activeSection === "payments" && (
              <PanelShell title="Pagos" description="Gestión de pagos.">
                <AdminPaymentsPanel
                  players={players}
                  initialPayments={payments}
                  month={currentMonth}
                  monthCharges={monthCharges}
                  fieldEvents={fieldEvents}
                  initialFieldPayments={fieldPayments}
                />
              </PanelShell>
            )}

            {activeSection === "matches" && (
              <PanelShell title="Partidos" description="Gestión de partidos.">
                <AdminMatchesPanel initialMatches={matches} />
              </PanelShell>
            )}

            {activeSection === "absences" && (
              <PanelShell
                title="Ausencias"
                description="Registro y revisión de ausencias."
              >
                <AdminAbsencesPanel
                  players={agendaPlayers}
                  matches={agendaMatches}
                  initialAbsences={playerAbsences}
                />
              </PanelShell>
            )}

            {activeSection === "players" && (
              <PanelShell
                title="Jugadoras"
                description="Gestión de jugadoras activas e inactivas."
              >
                <AdminPlayersPanel initialPlayers={adminPlayers} />
              </PanelShell>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  detail: string;
};

const SummaryCard = ({ title, value, detail }: SummaryCardProps) => {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--ankara-blue)] dark:text-white">
        {value}
      </p>

      <p className="mt-3 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
};

type AdminNavButtonProps = {
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
};

const AdminNavButton = ({
  label,
  description,
  isActive,
  onClick,
}: AdminNavButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border px-4 py-3 text-left transition-all",
        isActive
          ? "border-[var(--ring)] bg-[var(--surface-mint)] shadow-sm"
          : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-soft)]",
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </button>
  );
};

type PanelShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const PanelShell = ({ title, description, children }: PanelShellProps) => {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
          {title}
        </h2>
        <p className="text-sm text-[var(--muted)]">{description}</p>
      </div>

      <div>{children}</div>
    </section>
  );
};
