"use client";

export default function DownloadICSButton({ icsContent, filename }) {
  function download() {
    if (typeof window === "undefined") return;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="btn-ghost text-sm"
      title="Añadir a tu calendario"
    >
      📅 Calendario
    </button>
  );
}