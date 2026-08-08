import { getSupabaseServer } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user || null;
}
