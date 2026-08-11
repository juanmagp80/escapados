"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/ToastProvider";

export default function SaveButtons({ destination, lat, lon, query }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/toggle-destination?destination=${encodeURIComponent(destination)}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setSaved(Boolean(data.saved));
          setChecked(true);
        }
      })
      .catch(() => {
        if (mounted) setChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, [destination]);

  function post(url, formData, onOk) {
    startTransition(async () => {
      try {
        const res = await fetch(url, { method: "POST", body: formData });
        const data = await res.json();
        if (data.ok) {
          setSaved(!!data.saved);
          onOk(data);
        } else if (data.error) {
          notify(data.error, "error");
        }
        router.refresh();
      } catch {
        notify("No hemos podido completar la acción.", "error");
      }
    });
  }

  function toggleFavorite() {
    const formData = new FormData();
    formData.set("destination", destination);
    formData.set("lat", lat ?? "");
    formData.set("lon", lon ?? "");
    post("/api/toggle-destination", formData, (data) => {
      notify(data.saved ? "Añadido a favoritos ❤️" : "Quitado de favoritos");
    });
  }

  function saveTrip() {
    const formData = new FormData();
    formData.set("origin", query.origin);
    formData.set("destination", destination);
    formData.set("startDate", query.startDate);
    formData.set("endDate", query.endDate);
    formData.set("travelers", query.travelers);
    formData.set("transport", query.transport);
    formData.set("budget", query.budget);
    post("/api/save-trip", formData, () => {
      notify("Viaje guardado 💾");
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        className={`text-sm ${saved ? "btn-primary" : "btn-ghost"}`}
        disabled={pending || !checked}
        onClick={toggleFavorite}
      >
        {saved ? "❤️ Quitar favorito" : "🤍 Favorito"}
      </button>
      <button
        className="btn-ghost text-sm"
        disabled={pending}
        onClick={saveTrip}
      >
        💾 Guardar viaje
      </button>
    </div>
  );
}