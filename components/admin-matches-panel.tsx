"use client";

import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Match } from "@/types/match";

type AdminMatchesPanelProps = {
  initialMatches: Match[];
};

type FormState = {
  roundNumber: string;
  opponent: string;
  matchDate: string;
  matchTime: string;
  fieldLabel: string;
  status: "upcoming" | "played";
  result: "won" | "lost" | "draw" | "";
  ankaraGoals: string;
  opponentGoals: string;
  scorers: string;
  photosUrl: string;
};

const initialFormState: FormState = {
  roundNumber: "",
  opponent: "",
  matchDate: "",
  matchTime: "",
  fieldLabel: "",
  status: "upcoming",
  result: "",
  ankaraGoals: "",
  opponentGoals: "",
  scorers: "",
  photosUrl: "",
};

export default function AdminMatchesPanel({
  initialMatches,
}: AdminMatchesPanelProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => a.roundNumber - b.roundNumber);
  }, [matches]);

  const handleChange = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingMatchId(null);
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setFeedback(null);

    const supabase = createBrowserSupabaseClient();

    const scorersArray =
      form.scorers.trim().length > 0
        ? form.scorers
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const isPlayed = form.status === "played";

    const payload = {
      round_number: Number(form.roundNumber),
      opponent: form.opponent.trim(),
      match_date: form.matchDate,
      match_time: form.matchTime,
      field_label: form.fieldLabel.trim(),
      status: form.status,
      result: isPlayed ? form.result || null : null,
      ankara_goals: isPlayed && form.ankaraGoals !== "" ? Number(form.ankaraGoals) : null,
      opponent_goals:
        isPlayed && form.opponentGoals !== "" ? Number(form.opponentGoals) : null,
      scorers: isPlayed ? scorersArray : [],
      photos_url: form.photosUrl.trim() || null,
      active: true,
    };

    if (editingMatchId !== null) {
      const { data, error } = await supabase
        .from("matches")
        .update(payload)
        .eq("id", editingMatchId)
        .select("*")
        .single();

      if (error || !data) {
        console.error(error);
        setSaving(false);
        setFeedback("error");
        return;
      }

      const updatedMatch: Match = {
        id: data.id,
        roundNumber: data.round_number,
        opponent: data.opponent,
        matchDate: data.match_date,
        matchTime: data.match_time,
        fieldLabel: data.field_label,
        status: data.status,
        result: data.result ?? undefined,
        ankaraGoals: data.ankara_goals ?? undefined,
        opponentGoals: data.opponent_goals ?? undefined,
        scorers: data.scorers ?? [],
        photosUrl: data.photos_url ?? undefined,
        active: data.active,
      };

      setMatches((prev) =>
        prev.map((match) => (match.id === editingMatchId ? updatedMatch : match))
      );

      setSaving(false);
      setFeedback("success");
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("matches")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      setSaving(false);
      setFeedback("error");
      return;
    }

    const newMatch: Match = {
      id: data.id,
      roundNumber: data.round_number,
      opponent: data.opponent,
      matchDate: data.match_date,
      matchTime: data.match_time,
      fieldLabel: data.field_label,
      status: data.status,
      result: data.result ?? undefined,
      ankaraGoals: data.ankara_goals ?? undefined,
      opponentGoals: data.opponent_goals ?? undefined,
      scorers: data.scorers ?? [],
      photosUrl: data.photos_url ?? undefined,
      active: data.active,
    };

    setMatches((prev) => [...prev, newMatch]);
    setSaving(false);
    setFeedback("success");
    resetForm();
  };

    const handleEditMatch = (match: Match) => {
    setEditingMatchId(match.id);
    setFeedback(null);

    setForm({
      roundNumber: String(match.roundNumber),
      opponent: match.opponent,
      matchDate: match.matchDate,
      matchTime: match.matchTime.slice(0, 5),
      fieldLabel: match.fieldLabel,
      status: match.status,
      result: match.result ?? "",
      ankaraGoals:
        typeof match.ankaraGoals === "number" ? String(match.ankaraGoals) : "",
      opponentGoals:
        typeof match.opponentGoals === "number" ? String(match.opponentGoals) : "",
      scorers: match.scorers.join(", "),
      photosUrl: match.photosUrl ?? "",
    });
  };

  const isPlayed = form.status === "played";

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            {editingMatchId !== null ? "Editar partido" : "Cargar partido"}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {editingMatchId !== null
              ? "Actualizá resultado, goles, goleadoras y fotos."
              : "Agregá próximas fechas o resultados ya jugados."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Número de fecha"
              value={form.roundNumber}
              onChange={(value) => handleChange("roundNumber", value)}
              type="number"
              required
            />

            <Field
              label="Rival"
              value={form.opponent}
              onChange={(value) => handleChange("opponent", value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Fecha"
              value={form.matchDate}
              onChange={(value) => handleChange("matchDate", value)}
              type="date"
              required
            />

            <Field
              label="Hora"
              value={form.matchTime}
              onChange={(value) => handleChange("matchTime", value)}
              type="time"
              required
            />

            <Field
              label="Cancha"
              value={form.fieldLabel}
              onChange={(value) => handleChange("fieldLabel", value)}
              placeholder="Ej: Cancha 3"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Estado"
              value={form.status}
              onChange={(value) =>
                handleChange("status", value as FormState["status"])
              }
              options={[
                { value: "upcoming", label: "Próximo partido" },
                { value: "played", label: "Ya jugado" },
              ]}
            />

            <SelectField
              label="Resultado"
              value={form.result}
              onChange={(value) => handleChange("result", value)}
              disabled={!isPlayed}
              options={[
                { value: "", label: "Seleccionar" },
                { value: "won", label: "Ganado" },
                { value: "lost", label: "Perdido" },
                { value: "draw", label: "Empatado" },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Goles"
              value={form.ankaraGoals}
              onChange={(value) => handleChange("ankaraGoals", value)}
              type="number"
              disabled={!isPlayed}
            />

            <Field
              label="Goles rival"
              value={form.opponentGoals}
              onChange={(value) => handleChange("opponentGoals", value)}
              type="number"
              disabled={!isPlayed}
            />
          </div>

          <Field
            label="Goleadoras"
            value={form.scorers}
            onChange={(value) => handleChange("scorers", value)}
            disabled={!isPlayed}
          />

          <Field
            label="Link fotos Drive"
            value={form.photosUrl}
            onChange={(value) => handleChange("photosUrl", value)}
            placeholder="https://drive.google.com/..."
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--ankara-blue)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
            >
              {saving
              ? "Guardando..."
              : editingMatchId !== null
              ? "Guardar cambios"
              : "Guardar partido"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            >
              Limpiar
            </button>

            {feedback === "success" && (
              <p className="text-sm font-medium text-green-600">Partido guardado</p>
            )}

            {feedback === "error" && (
              <p className="text-sm font-medium text-red-600">
                Error al guardar el partido
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            Fixture cargado
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Vista rápida de las fechas guardadas.
          </p>
        </div>

        <div className="grid gap-3">
          {sortedMatches.map((match) => (
            <article
              key={match.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">
                    Fecha {match.roundNumber}
                  </p>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    Ankara vs {match.opponent}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {match.matchDate} · {match.matchTime.slice(0, 5)} hs · {match.fieldLabel}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {match.photosUrl ? "Fotos cargadas" : "Sin link de fotos"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    match.status === "played"
                      ? "bg-[rgba(34,197,94,0.10)] text-green-700 dark:text-green-400"
                      : "bg-[var(--surface-blue)] text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]"
                  }`}
                >
                  {match.status === "played" ? "Jugado" : "Próximo"}
                </span>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEditMatch(match)}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                >
                  Editar
                </button>
              </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
}: FieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--ankara-mint)] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
};

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: SelectFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ankara-mint)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}