import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function RegistroPage() {
  return (
    <main className="container-narrow">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-ink">Crear cuenta</h1>
        <p className="mt-1 text-sm text-stone-500">
          Guarda tus viajes y destinos favoritos.
        </p>
        <div className="mt-5">
          <AuthForm mode="register" />
        </div>
        <p className="mt-5 text-center text-sm text-stone-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-brand-600">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
