"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type CopyAliasButtonProps = {
  alias: string;
};

const CopyAliasButton = ({ alias }: CopyAliasButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(alias);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("No se pudo copiar el alias", error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-sm">
        {alias}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar alias"
        title="Copiar alias"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          copied
            ? "border-[var(--ankara-mint)] bg-[var(--surface-mint)] text-[var(--ankara-blue)]"
            : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--ankara-mint)] hover:bg-[var(--surface-mint)]"
        }`}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  );
};

export default CopyAliasButton;
