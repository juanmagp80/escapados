"use client";

import { useToast } from "@/components/common/ToastProvider";
import { useState, useTransition } from "react";

// Formulario para guardar el chat ID de Telegram.
export default function TelegramChatIdForm({ chatId }) {
  const notify = useToast();
  const [value, setValue] = useState(chatId || "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("telegram_chat_id", value.trim() || "");

      const res = await fetch("/api/preferences/telegram", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        notify("Chat ID de Telegram guardado ✓");
      } else {
        notify(data.error || "Error al guardar.", "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ej: 123456789"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          disabled={pending}
        />
        <button
          onClick={save}
          disabled={pending || !value.trim()}
          className="btn-primary shrink-0 text-sm"
        >
          Guardar
        </button>
      </div>
      <p className="text-xs text-stone-400">
        Obtén tu chat ID enviando un mensaje a{" "}
        <a
          href="https://t.me/chatcreatorbot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          @chatcreatorbot
        </a>{" "}
        y copia el número que te devuelve.
      </p>
      {chatId && (
        <p className="text-xs text-green-600">
          ✓ Configurado: {chatId}
        </p>
      )}
    </div>
  );
}
