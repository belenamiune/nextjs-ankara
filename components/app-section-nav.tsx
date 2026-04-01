"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/", label: "Pagos" },
  { href: "/fixture", label: "Fixture" },
  { href: "/agenda", label: "Agenda" },
  { href: "/admin-access", label: "Admin" },
];

export default function AppSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full">
      <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm">
        {sections.map((section) => {
          const isActive = pathname === section.href;

          return (
            <Link
              key={section.href}
              href={section.href}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-[var(--ankara-blue)] text-white dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
                  : "text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}