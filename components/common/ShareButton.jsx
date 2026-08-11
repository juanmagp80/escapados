"use client";

import { useToast } from "@/components/common/ToastProvider";

export default function ShareButton({ url, title }) {
  const notify = useToast();

  async function share() {
    const fullUrl =
      typeof window !== "undefined"
        ? new URL(url, window.location.origin).toString()
        : url;
    const text = `${title} — Escapa²`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: text, url: fullUrl });
        return;
      } catch {
        // El usuario canceló o no está soportado; seguimos con el portapapeles.
      }
    }
    try {
      await navigator.clipboard.writeText(fullUrl);
      notify("Enlace copiado ✓");
    } catch {
      notify("Copia el enlace manualmente", "error");
    }
  }

  const shareText = `${title} — Escapa² ${typeof window !== "undefined" ? new URL(url, window.location.origin).toString() : url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={share}
          className="btn-ghost text-sm"
          title="Copiar enlace"
        >
          🔗 Compartir
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-sm"
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  );
}