"use client";

import { useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/lib/supabase/browser";

export default function RecuperarPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!supabase) throw new Error("El servicio no está disponible ahora.");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || "No hemos podido enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-narrow">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-ink">Recuperar contraseña</h1>
        {sent ? (
          <p className="mt-4 text-sm text-stone-600">
            Enviamos un enlace a <strong>{email}</strong>. Revisa tu correo y
            sigue las instrucciones para crear una nueva contraseña.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-stone-500">
              Te enviaremos un enlace seguro para restablecerla.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-600">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          </>
        )}
        <p className="mt-5 text-center text-sm text-stone-500">
          <Link href="/login" className="font-semibold text-brand-600">
            ← Volver a entrar
          </Link>
        </p>
      </div>
    </main>
  );
}