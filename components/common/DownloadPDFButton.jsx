"use client";

// Genera un HTML imprimible con el itinerario y lo abre en una ventana
// nueva para que el usuario pueda guardarlo como PDF (Ctrl+P → Guardar como PDF).
export default function DownloadPDFButton({ destination, itinerary, costEstimate }) {
    if (!itinerary || !itinerary.days || itinerary.days.length === 0) return null;

    function download() {
        if (typeof window === "undefined") return;

        const daysHtml = itinerary.days
            .map(
                (d) => `
        <div class="day">
          <h2>Día ${d.day} — ${d.title || ""}</h2>
          <ul>
            ${(d.activities || [])
                        .map(
                            (a) => `
                <li>
                  <strong>${a.time || ""}</strong> ${a.name}
                  ${a.description ? `<br><small>${a.description}</small>` : ""}
                  ${a.duration ? `<br><small>Duración: ${a.duration}</small>` : ""}
                </li>`
                        )
                        .join("")}
          </ul>
          ${d.restaurants?.length ? `<p class="restaurants">🍽️ ${d.restaurants.join(" · ")}</p>` : ""}
        </div>`
            )
            .join("");

        const costHtml = costEstimate
            ? `
      <div class="cost">
        <h2>Coste estimado</h2>
        <p>Total: <strong>${costEstimate.estimatedCost} €</strong></p>
        <p>Por persona: ${(costEstimate.estimatedCost / (costEstimate.travelers || 2)).toFixed(0)} € · ${costEstimate.nights} noches</p>
      </div>`
            : "";

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Escapada a ${destination}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1c1917; }
    h1 { color: #ea580c; font-size: 28px; margin-bottom: 4px; }
    .subtitle { color: #78716c; margin-bottom: 24px; }
    .day { margin-bottom: 24px; border-left: 3px solid #fdba74; padding-left: 16px; }
    .day h2 { color: #ea580c; font-size: 18px; margin-bottom: 8px; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 8px; }
    small { color: #78716c; }
    .restaurants { color: #78716c; font-size: 14px; }
    .cost { background: #fff7ed; border-radius: 8px; padding: 16px; margin-top: 24px; }
    .cost h2 { color: #ea580c; font-size: 18px; margin-bottom: 8px; }
    .footer { margin-top: 32px; color: #a8a29e; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>🏖️ Escapada a ${destination}</h1>
  <p class="subtitle">Generado con Escapa2 · ${new Date().toLocaleDateString("es-ES")}</p>
  ${itinerary.summary ? `<p>${itinerary.summary}</p>` : ""}
  ${daysHtml}
  ${costHtml}
  ${itinerary.notes ? `<p class="notes">📝 ${itinerary.notes}</p>` : ""}
  <p class="footer">Escapa2 — ¿Dónde nos escapamos?</p>
</body>
</html>`;

        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
    }

    return (
        <button
            onClick={download}
            className="btn-ghost text-sm"
            title="Guardar como PDF (Ctrl+P → Guardar como PDF)"
        >
            📄 PDF
        </button>
    );
}