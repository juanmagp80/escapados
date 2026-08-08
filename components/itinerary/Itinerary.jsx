"use client";

import { useEffect, useState } from "react";

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-1/3 rounded bg-stone-200" />
          <div className="h-3 w-2/3 rounded bg-stone-200" />
          <div className="h-3 w-1/2 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}

function Activity({ a }) {
  return (
    <li className="flex gap-3">
      <div className="flex w-14 shrink-0 flex-col items-end pt-0.5 text-right">
        <span className="text-sm font-semibold text-brand-600">{a.time}</span>
        {a.duration && (
          <span className="text-xs text-stone-400">{a.duration}</span>
        )}
      </div>
      <div className="flex-1 border-l border-stone-200 pb-4 pl-4">
        <p className="font-semibold text-ink">{a.name}</p>
        {a.description && (
          <p className="mt-0.5 text-sm text-stone-500">{a.description}</p>
        )}
      </div>
    </li>
  );
}

export default function Itinerary({ destination, query }) {
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    const params = new URLSearchParams({
      destination,
      startDate: query.startDate || "",
      endDate: query.endDate || "",
      travelers: query.travelers || 2,
      budget: query.budget || "",
    });
    const ctrl = new AbortController();
    setState({ status: "loading", data: null });

    fetch(`/api/itinerary?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setState({ status: "empty", data });
        else setState({ status: "done", data });
      })
      .catch(() =>
        setState({
          status: "empty",
          data: { error: "No hemos podido generar el itinerario." },
        })
      );

    return () => ctrl.abort();
  }, [destination, query.startDate, query.endDate, query.travelers, query.budget]);

  if (state.status === "loading") return <Skeleton />;
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
      {days.map((d) => (
        <div key={d.day}>
          <h3 className="mb-2 flex items-center gap-2 font-bold text-ink">
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-sm text-brand-700">
              Día {d.day}
            </span>
            {d.title}
          </h3>
          <ul>
            {d.activities.map((a, i) => (
              <Activity key={i} a={a} />
            ))}
          </ul>
          {d.restaurants?.length > 0 && (
            <p className="mt-1 pl-[4.5rem] text-sm text-stone-500">
              🍽️ {d.restaurants.join(" · ")}
            </p>
          )}
        </div>
      ))}
      {notes && (
        <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-400">
          {notes}
        </p>
      )}
    </div>
  );
}
