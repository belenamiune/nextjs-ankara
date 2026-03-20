"use client";

import { useState } from "react";

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
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800">
        {alias}
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
      >
        {copied ? "Copiado" : "Copiar alias"}
      </button>
    </div>
  );
};

export default CopyAliasButton;