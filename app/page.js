import SearchForm from "../components/search/SearchForm";

export default function HomePage() {
  return (
    <main className="container-narrow flex min-h-screen flex-col justify-center lg:flex-row lg:items-center lg:gap-12 lg:py-16">
      <header className="mb-8 text-center lg:mb-0 lg:text-left lg:flex-1">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-600 lg:text-6xl">
          Escapa²
        </h1>
        <h2 className="mt-4 text-2xl font-bold text-ink lg:text-4xl">
          ¿Dónde nos escapamos?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-stone-500 lg:text-lg">
          Encuentra destinos, alojamiento, transporte y planes para vuestra
          próxima escapada.
        </p>
        <div className="mt-8 hidden lg:block">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-400">
            Cómo funciona
          </p>
          <ol className="space-y-3 text-sm text-stone-600">
            {[
              "Dinos desde dónde salís y cuándo.",
              "Elige coche o avión y tu presupuesto.",
              "Te mostramos escapadas con coste estimado.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <section className="card p-5 lg:w-[420px] lg:flex-none lg:p-7">
        <SearchForm />
      </section>

      <section className="mt-8 lg:hidden">
        <div className="flex items-center gap-3 text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Cómo funciona
          </span>
          <span className="h-px flex-1 bg-stone-200" />
        </div>
        <ol className="mt-4 space-y-3 text-sm text-stone-600">
          {[
            "Dinos desde dónde salís y cuándo.",
            "Elige coche o avión y tu presupuesto.",
            "Te mostramos escapadas con coste estimado.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
