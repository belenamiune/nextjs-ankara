"use client";

import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AdminPlayer = {
  id: number;
  name: string;
  nickname?: string;
  email?: string;
  birthDate?: string;
  active: boolean;
};

type AdminPlayersPanelProps = {
  initialPlayers: AdminPlayer[];
};

type FormState = {
  name: string;
  nickname: string;
  email: string;
  birthDate: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  nickname: "",
  email: "",
  birthDate: "",
  active: true,
};

export default function AdminPlayersPanel({ initialPlayers }: AdminPlayersPanelProps) {
  const [players, setPlayers] = useState<AdminPlayer[]>(initialPlayers);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.id - b.id);
  }, [players]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingPlayerId(null);
    setForm(emptyForm);
    setFeedback(null);
  };

  const handleEdit = (player: AdminPlayer) => {
    setEditingPlayerId(player.id);
    setFeedback(null);
    setForm({
      name: player.name,
      nickname: player.nickname ?? "",
      email: player.email ?? "",
      birthDate: player.birthDate ?? "",
      active: player.active,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSaving(true);
    setFeedback(null);

    const supabase = createBrowserSupabaseClient();

    const payload = {
      name: form.name.trim(),
      nickname: form.nickname.trim() || null,
      email: form.email.trim() || null,
      birth_date: form.birthDate || null,
      active: form.active,
    };

    if (editingPlayerId === null) {
      const { data, error } = await supabase
        .from("players")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        console.error(error);
        setSaving(false);
        setFeedback("error");
        return;
      }

      const newPlayer: AdminPlayer = {
        id: data.id,
        name: data.name,
        nickname: data.nickname ?? undefined,
        email: data.email ?? undefined,
        birthDate: data.birth_date ?? undefined,
        active: data.active,
      };

      setPlayers((prev) => [...prev, newPlayer]);
      setSaving(false);
      setFeedback("success");
      resetForm();
      return;
    }

    const { data, error } = await supabase
      .from("players")
      .update(payload)
      .eq("id", editingPlayerId)
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      setSaving(false);
      setFeedback("error");
      return;
    }

    const updatedPlayer: AdminPlayer = {
      id: data.id,
      name: data.name,
      nickname: data.nickname ?? undefined,
      email: data.email ?? undefined,
      birthDate: data.birth_date ?? undefined,
      active: data.active,
    };

    setPlayers((prev) =>
      prev.map((player) => (player.id === editingPlayerId ? updatedPlayer : player))
    );

    setSaving(false);
    setFeedback("success");
    resetForm();
  };

  const handleToggleActive = async (player: AdminPlayer) => {
    const supabase = createBrowserSupabaseClient();

    setToggleLoadingId(player.id);

    const { data, error } = await supabase
      .from("players")
      .update({ active: !player.active })
      .eq("id", player.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error(error);
      setToggleLoadingId(null);
      return;
    }

    const updatedPlayer: AdminPlayer = {
      id: data.id,
      name: data.name,
      nickname: data.nickname ?? undefined,
      email: data.email ?? undefined,
      birthDate: data.birth_date ?? undefined,
      active: data.active,
    };

    setPlayers((prev) =>
      prev.map((currentPlayer) =>
        currentPlayer.id === player.id ? updatedPlayer : currentPlayer
      )
    );

    if (editingPlayerId === player.id) {
      setForm((prev) => ({
        ...prev,
        active: data.active,
      }));
    }

    setToggleLoadingId(null);
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            {editingPlayerId === null ? "Nueva jugadora" : "Editar jugadora"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field
            label="Nombre completo"
            value={form.name}
            onChange={(value) => handleChange("name", value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Apodo"
              value={form.nickname}
              onChange={(value) => handleChange("nickname", value)}
            />

            <Field
              label="Mail"
              value={form.email}
              onChange={(value) => handleChange("email", value)}
              type="email"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Cumpleaños"
              value={form.birthDate}
              onChange={(value) => handleChange("birthDate", value)}
              type="date"
            />

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Estado</span>
              <select
                value={form.active ? "active" : "inactive"}
                onChange={(event) =>
                  handleChange("active", event.target.value === "active")
                }
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ankara-mint)]"
              >
                <option value="active">Activa</option>
                <option value="inactive">Inactiva</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--ankara-blue)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
            >
              {saving
                ? "Guardando..."
                : editingPlayerId === null
                  ? "Crear jugadora"
                  : "Guardar cambios"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            >
              {editingPlayerId === null ? "Limpiar" : "Cancelar"}
            </button>

            {feedback === "success" && (
              <p className="text-sm font-medium text-green-600">Guardado</p>
            )}

            {feedback === "error" && (
              <p className="text-sm font-medium text-red-600">Error al guardar</p>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
            Jugadoras
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Listado de jugadoras activas e inactivas.
          </p>
        </div>

        <div className="grid gap-3">
          {sortedPlayers.map((player) => (
            <article
              key={player.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    {player.nickname ?? player.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">{player.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {player.email ?? "Sin mail"} · {player.birthDate ?? "Sin cumpleaños"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      player.active
                        ? "bg-[rgba(34,197,94,0.12)] text-green-700 dark:text-green-400"
                        : "bg-[rgba(239,68,68,0.12)] text-red-700 dark:text-red-400"
                    }`}
                  >
                    {player.active ? "Activa" : "Inactiva"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleEdit(player)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    disabled={toggleLoadingId === player.id}
                    onClick={() => handleToggleActive(player)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {toggleLoadingId === player.id
                      ? "Guardando..."
                      : player.active
                        ? "Desactivar"
                        : "Activar"}
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
  required?: boolean;
};

function Field({ label, value, onChange, type = "text", required }: FieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ankara-mint)]"
      />
    </label>
  );
}
