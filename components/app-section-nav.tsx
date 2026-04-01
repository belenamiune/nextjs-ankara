"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const sections = [
  { href: "/", label: "Pagos" },
  { href: "/fixture", label: "Fixture" },
  { href: "/agenda", label: "Agenda" },
  { href: "/jugadoras", label: "Jugadoras" },
  { href: "/historial", label: "Historial" },
  { href: "/stats", label: "Estadísticas" },
  { href: "/admin-access", label: "Admin" },
];

export default function AppSectionNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentSection = useMemo(() => {
    return sections.find((section) => section.href === pathname) ?? sections[0];
  }, [pathname]);

  return (
    <>
      <nav className="w-full">
        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm">
            <div className="min-w-0 flex-1 rounded-xl bg-[var(--ankara-blue)] px-4 py-3 text-sm font-medium text-white dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]">
              <span className="block truncate">{currentSection.label}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            >
              Ver secciones
            </button>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-7">
              {sections.map((section) => {
                const isActive = pathname === section.href;

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={[
                      "flex min-h-[52px] items-center justify-center rounded-2xl px-4 py-3 text-center text-sm font-medium transition",
                      isActive
                        ? "bg-[var(--ankara-blue)] text-white shadow-sm dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
                        : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-soft)]",
                    ].join(" ")}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar secciones"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/30"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border)]" />

            <div className="mb-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Secciones
              </h2>
              <p className="text-sm text-[var(--muted)]">Elegí a dónde querés ir.</p>
            </div>

            <div className="grid gap-2">
              {sections.map((section) => {
                const isActive = pathname === section.href;

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    onClick={() => setIsOpen(false)}
                    className={[
                      "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-[var(--surface-mint)] text-[var(--ankara-blue)] dark:text-[var(--ankara-mint)]"
                        : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-soft)]",
                    ].join(" ")}
                  >
                    <span>{section.label}</span>
                    {isActive ? <span>•</span> : null}
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
