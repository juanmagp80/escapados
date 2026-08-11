"use client";

import { useSupabase } from "@/lib/supabase/browser";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode = "login" }) {
  const supabase = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (emailSent) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Casi está. Te hemos enviado un correo a{" "}
        <strong>{email}</strong>. Confírmalo para poder entrar.
      </p>
    );
  }

  if (!supabase) {
    return (
      <p className="text-sm text-stone-400">
        El registro no está disponible ahora mismo.
      </p>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/confirm?type=signup`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/viajes");
        } else {
          setEmailSent(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/viajes");
      router.refresh();
    } catch (err) {
      setError(err.message || "Ha ocurrido un error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-600">
            Nombre
          </label>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
      )}
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
      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-600">
          Contraseña
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

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading
          ? "Un momento..."
          : mode === "register"
          ? "Crear cuenta"
          : "Entrar"}
      </button>
    </form>
  );
}
