"use client";

import { useState } from "react";

// Reporte de gasto real tras el viaje. Alimenta los datos de la comunidad.
export default function ExpenseReport({ destination }) {
    const [expenses, setExpenses] = useState({
        total: "",
        hotel: "",
        transport: "",
        food: "",
        activities: "",
        travelers: 2,
        nights: 2,
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    function update(field, value) {
        setExpenses((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!expenses.total) {
            setMessage({ type: "error", text: "Indica el gasto total." });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/expense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, ...expenses }),
            });
            const data = await res.json();
            if (data.error) {
                setMessage({ type: "error", text: data.error });
            } else {
                setMessage({ type: "success", text: "Gasto reportado. ¡Gracias! 💶" });
            }
        } catch {
            setMessage({ type: "error", text: "No hemos podido guardar el gasto." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-stone-100 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                💶 ¿Ya has vuelto? Reporta tu gasto real
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div>
                    <label className="mb-1 block text-xs text-stone-500">Total (€)</label>
                    <input
                        type="number"
                        min={0}
                        className="field"
                        value={expenses.total}
                        onChange={(e) => update("total", e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-stone-500">Hotel (€)</label>
                    <input
                        type="number"
                        min={0}
                        className="field"
                        value={expenses.hotel}
                        onChange={(e) => update("hotel", e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-stone-500">Transporte (€)</label>
                    <input
                        type="number"
                        min={0}
                        className="field"
                        value={expenses.transport}
                        onChange={(e) => update("transport", e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-stone-500">Comida (€)</label>
                    <input
                        type="number"
                        min={0}
                        className="field"
                        value={expenses.food}
                        onChange={(e) => update("food", e.target.value)}
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-stone-500">Actividades (€)</label>
                    <input
                        type="number"
                        min={0}
                        className="field"
                        value={expenses.activities}
                        onChange={(e) => update("activities", e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="mb-1 block text-xs text-stone-500">Viajeros</label>
                        <input
                            type="number"
                            min={1}
                            className="field"
                            value={expenses.travelers}
                            onChange={(e) => update("travelers", Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-stone-500">Noches</label>
                        <input
                            type="number"
                            min={1}
                            className="field"
                            value={expenses.nights}
                            onChange={(e) => update("nights", Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
            <button type="submit" className="btn-ghost text-sm" disabled={saving}>
                {saving ? "Guardando…" : "Reportar gasto"}
            </button>
            {message && (
                <p
                    className={`rounded-xl px-3 py-2 text-sm ${message.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                >
                    {message.text}
                </p>
            )}
        </form>
    );
}