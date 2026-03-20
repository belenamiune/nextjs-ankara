"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

type ReminderMessageBoxProps = {
  message: string;
};

const ReminderMessageBox = ({ message }: ReminderMessageBoxProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("No se pudo copiar el mensaje", error);
    }
  };

  const handleWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Recordatorio automático
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Texto listo para copiar y enviar al grupo o por mensaje privado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            aria-label="Copiar mensaje"
            title="Copiar mensaje"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white transition hover:opacity-90"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>

          <button
            onClick={handleWhatsApp}
            aria-label="Abrir en WhatsApp"
            title="Abrir en WhatsApp"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white transition hover:opacity-90"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      <textarea
        readOnly
        value={message}
        className="min-h-[160px] w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 outline-none"
      />
    </section>
  );
};

export default ReminderMessageBox;