"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function SaveButtons({ destination, lat, lon, query }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState(null);

  async function save(formData, action) {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch(action, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) setMsg("Guardado ✓");
      else if (data.error) setMsg(data.error);
      router.refresh();
    });
  }

  const destForm = new FormData();
  destForm.set("destination", destination);
  destForm.set("lat", lat ?? "");
  destForm.set("lon", lon ?? "");

  const tripForm = new FormData();
  tripForm.set("origin", query.origin);
  tripForm.set("destination", destination);
  tripForm.set("startDate", query.startDate);
  tripForm.set("endDate", query.endDate);
  tripForm.set("travelers", query.travelers);
  tripForm.set("transport", query.transport);
  tripForm.set("budget", query.budget);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn-ghost text-sm"
          disabled={pending}
          onClick={() => save(destForm, "/api/save-destination")}
        >
          ❤️ Favorito
        </button>
        <button
          className="btn-ghost text-sm"
          disabled={pending}
          onClick={() => save(tripForm, "/api/save-trip")}
        >
          💾 Guardar viaje
        </button>
      </div>
      {msg && (
        <p className="text-center text-sm text-brand-700">{msg}</p>
      )}
    </div>
  );
}
