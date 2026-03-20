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
    <div className="flex items-center gap-2">
      <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800">
        {alias}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar alias"
        title="Copiar alias"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  );
};

export default CopyAliasButton;