"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import PageModeSwitch from "@/components/page-mode-switch";

export default function AdminAccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Pusiste cualquier cosa. Intenta de nuevo");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo validar la clave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2 shadow-sm">
              <Image
                src="/logo.png"
                alt="Logo Ankara"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-wide text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]">
                Ankara
              </p>
              <p className="text-sm text-[var(--muted)]">Acceso administrador</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <PageModeSwitch href="/" label="Volver" />
          </div>
        </header>

        <section className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 rounded-full border border-[var(--border)] bg-[var(--surface-mint)] p-3">
                <Image
                  src="/logo.png"
                  alt="Logo Ankara"
                  width={52}
                  height={52}
                  className="h-12 w-12 object-contain"
                />
              </div>

              <span className="mb-3 rounded-full bg-[var(--surface-blue)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]">
                Admin
              </span>

              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                Acceso admin
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Ingresá la clave para entrar al panel administrador.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="admin-password"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Clave
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresar contraseña"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--ankara-mint)] focus:ring-2 focus:ring-[var(--ring)]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--ankara-blue)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
              >
                {loading ? "Validando" : "Entrar"}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-4 py-3">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
