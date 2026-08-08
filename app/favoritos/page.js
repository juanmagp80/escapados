import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/session";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FavoritosPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-narrow text-center">
        <h1 className="text-2xl font-bold text-ink">Favoritos</h1>
        <p className="mt-2 text-stone-500">
          Inicia sesión para guardar destinos.
        </p>
        <Link href="/login" className="btn-primary mt-5">
          Entrar
        </Link>
      </main>
    );
  }

  const supabase = getSupabaseServer();
  const { data: dests } = await supabase
    .from("saved_destinations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="container-app">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Destinos favoritos</h1>
        <p className="text-sm text-stone-500">
          {dests?.length || 0} destino(s) guardado(s).
        </p>
      </header>

      {dests && dests.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dests.map((d) => (
            <article key={d.id} className="card overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-brand-300 to-brand-500" />
              <div className="p-4">
                <h2 className="text-lg font-bold text-ink">
                  {d.destination}
                </h2>
                {d.country && (
                  <p className="text-sm text-stone-500">{d.country}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-stone-500">No tienes destinos guardados.</p>
          <Link href="/" className="btn-ghost mt-4">
            Buscar escapadas
          </Link>
        </div>
      )}
    </main>
  );
}
