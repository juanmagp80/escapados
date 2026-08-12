"use client";

import DownloadPDFButton from "@/components/common/DownloadPDFButton";
import ItineraryChat from "@/components/itinerary/ItineraryChat";
import ItineraryEditor from "@/components/itinerary/ItineraryEditor";
import ItineraryGeo from "@/components/itinerary/ItineraryGeo";
import SectionLoader from "@/components/loading/SectionLoader";
import { useEffect, useState } from "react";

export default function Itinerary({ destination, query }) {
  const [state, setState] = useState({ status: "loading", data: null });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({
      destination,
      startDate: query.startDate || "",
      endDate: query.endDate || "",
      travelers: query.travelers || 2,
      budget: query.budget || "",
    });
    const ctrl = new AbortController();
    const startTime = Date.now();
    setState({ status: "loading", data: null });

    fetch(`/api/itinerary?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const elapsed = Date.now() - startTime;
        const minDelay = 4000;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          if (data.error) setState({ status: "empty", data });
          else setState({ status: "done", data });
        }, remaining);
      })
      .catch((err) => {
        const elapsed = Date.now() - startTime;
        const minDelay = 4000;
        const remaining = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          setState({
            status: "empty",
            data: { error: "No hemos podido generar el itinerario." },
          });
        }, remaining);
      });

    return () => ctrl.abort();
  }, [destination, query.startDate, query.endDate, query.travelers, query.budget]);

  if (state.status === "loading")
    return <SectionLoader label="Diseñando el itinerario con la IA…" />;
  if (state.status === "empty")
    return (
      <p className="text-sm text-stone-400">
        {state.data?.error ||
          "No hemos podido generar el itinerario en este momento."}
      </p>
    );

  const { summary, notes, days } = state.data;

  return (
    <div className="space-y-4">
      {summary && <p className="text-sm text-stone-600">{summary}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditMode((v) => !v)}
          aria-pressed={editMode}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${editMode
              ? "bg-brand-500 text-white"
              : "bg-stone-100 text-stone-600"
            }`}
        >
          {editMode ? "✓ Hecho" : "✏️ Editar (arrastrar y soltar)"}
        </button>
      </div>

      {editMode ? (
        <ItineraryEditor
          days={days}
          onChange={(newDays) =>
            setState({ status: "done", data: { ...state.data, days: newDays } })
          }
        />
      ) : (
        <ItineraryGeo days={days} />
      )}

      {notes && (
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-400">
          {notes}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <DownloadPDFButton
          destination={destination}
          itinerary={state.data}
          costEstimate={{
            estimatedCost: 0,
            travelers: query.travelers || 2,
            nights: 0,
          }}
        />
      </div>
      <ItineraryChat
        destination={destination}
        itinerary={state.data}
        onRefined={(newItinerary) => setState({ status: "done", data: newItinerary })}
      />
    </div>
  );
}