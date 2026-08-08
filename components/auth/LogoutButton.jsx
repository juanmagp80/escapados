"use client";

import { useSupabase } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = useSupabase();
  const router = useRouter();
  if (!supabase) return null;

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="text-sm font-medium text-stone-500"
    >
      Salir
    </button>
  );
}
