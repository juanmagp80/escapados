"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/ToastProvider";

export default function DeleteButton({ table, id, label = "Eliminar" }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres eliminar?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("table", table);
      formData.set("id", id);
      const res = await fetch("/api/delete-saved", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        notify("Eliminado ✓");
        router.refresh();
      } else {
        notify(data.error || "No se pudo eliminar.", "error");
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-red-50 hover:text-red-600"
    >
      {pending ? "..." : `🗑️ ${label}`}
    </button>
  );
}