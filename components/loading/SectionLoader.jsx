"use client";

// Loader compacto para los apartados del detalle (hoteles, gasolineras,
// restaurantes, etc): pareja escapando + mensaje de "buscando…" animado.
export default function SectionLoader({ label = "Buscando datos…" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="romantic-loader">
        {/* Corazones */}
        <div className="css-hearts">
          <i />
          <i />
          <i />
        </div>

        {/* Pareja caminando */}
        <div className="css-couple">
          {/* Maleta izquierda */}
          <div className="css-suitcase suitcase-left">
            <span />
          </div>

          {/* Persona rosa (mujer) */}
          <div className="css-person person-pink">
            <span className="head" />
            <span className="body" />
            <span className="leg leg-a" />
            <span className="leg leg-b" />
          </div>

          {/* Persona azul (hombre) */}
          <div className="css-person person-blue">
            <span className="head" />
            <span className="body" />
            <span className="leg leg-a" />
            <span className="leg leg-b" />
          </div>

          {/* Maleta derecha */}
          <div className="css-suitcase suitcase-right">
            <span />
          </div>
        </div>

        {/* Camino */}
        <div className="loader-ground" />
      </div>

      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
        {label}
      </div>
    </div>
  );
}
