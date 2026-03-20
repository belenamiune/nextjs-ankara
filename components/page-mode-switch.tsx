"use client";

import Link from "next/link";

type PageModeSwitchProps = {
  href: string;
  label: string;
  dark?: boolean;
};

const PageModeSwitch = ({ href, label, dark = false }: PageModeSwitchProps) => {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${
        dark
          ? "bg-[var(--ankara-blue)] text-white hover:opacity-90 dark:bg-[var(--ankara-mint)] dark:text-[var(--ankara-blue)]"
          : "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--ankara-mint)] hover:bg-[var(--surface-mint)]"
      }`}
    >
      {label}
    </Link>
  );
};

export default PageModeSwitch;