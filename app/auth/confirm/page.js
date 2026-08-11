"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/browser";

function AuthConfirmPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "signup";

  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!supabase) {
        if (mounted) setStatus("no-supabase");
        return;
      }
      const { data } = await supabase.auth.getSession();
      const hasSession = Boolean(data.session);
      if (mounted) setStatus(hasSession ? "ready" : "no-session");
    }
    check();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function resetPassword(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Contraseña actualizada ✓");
      setTimeout(() => router.push("/viajes"), 1200);
    } catch (err) {
      setMsg(err.message || "No se pudo actualizar la contraseña.");
    }
  }

  return (
    <main className="container-narrow">
      <div className="card p-6 text-center">
        {status === "checking" && (
          <p className="text-stone-500">Comprobando tu enlace...</p>
        )}

        {status === "no-supabase" && (
          <p className="text-sm text-stone-400">
            El servicio no está disponible ahora mismo.
          </p>
        )}

        {status === "no-session" && (
          <>
            <h1 className="text-2xl font-bold text-ink">
              {type === "recovery"
                ? "Algo no cuadra"
                : "No hemos podido confirmar"}
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              El enlace es inválido o ha caducado. Pide uno nuevo.
            </p>
            <Link href="/recuperar" className="btn-ghost mt-5">
              Solicitar nuevo enlace
            </Link>
          </>
        )}

        {status === "ready" && type === "recovery" && (
          <>
            <h1 className="text-2xl font-bold text-ink">
              Nueva contraseña
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Elige una contraseña nueva para tu cuenta.
            </p>
            <form onSubmit={resetPassword} className="mt-5 space-y-4 text-left">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-600">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              {msg && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {msg}
                </p>
              )}
              <button type="submit" className="btn-primary w-full">
                Guardar contraseña
              </button>
            </form>
          </>
        )}

        {status === "ready" && type !== "recovery" && (
          <>
            <h1 className="text-2xl font-bold text-ink">
              ¡Email confirmado!
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Tu cuenta está activa. Ya puedes guardar escapadas y favoritos.
            </p>
            <Link href="/viajes" className="btn-primary mt-5">
              Ir a mis viajes
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmPage />
    </Suspense>
  );
}