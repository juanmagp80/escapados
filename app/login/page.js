import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="container-narrow">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-ink">Entrar</h1>
        <p className="mt-1 text-sm text-stone-500">
          Accede para guardar tus escapadas y destinos favoritos.
        </p>
        <div className="mt-5">
          <AuthForm mode="login" />
        </div>
        <p className="mt-5 text-center text-sm text-stone-500">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-600">
            Regístrate
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-stone-400">
        Puedes buscar escapadas sin registrarte.
      </p>
    </main>
  );
}
