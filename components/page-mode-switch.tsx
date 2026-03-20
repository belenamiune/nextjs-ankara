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
          ? "bg-black text-white hover:opacity-90"
          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
};

export default PageModeSwitch;