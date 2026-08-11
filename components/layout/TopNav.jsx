import LogoutButton from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/supabase/session";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/viajes", label: "Viajes" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/comunidad", label: "Comunidad" },
];

export default async function TopNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold text-brand-600">
          Escapa²
        </Link>
        <nav className="flex items-center gap-4">
          {LINKS.slice(1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-stone-600"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/perfil"
                className="text-sm font-medium text-stone-600"
                title="Tu perfil"
              >
                👤
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn-ghost text-sm">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
