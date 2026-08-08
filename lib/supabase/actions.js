import { getSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function requireUser(supabase) {
  return supabase.auth.getUser();
}

export async function saveTripAction(formData) {
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "Supabase no configurado" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para guardar." };

  const payload = {
    user_id: user.id,
    origin: formData.get("origin"),
    destination: formData.get("destination"),
    start_date: formData.get("startDate") || null,
    end_date: formData.get("endDate") || null,
    travelers: Number(formData.get("travelers")) || 2,
    transport: formData.get("transport"),
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
  };

  const { error } = await supabase.from("trips").insert(payload);
  if (error) return { error: "No hemos podido guardar el viaje." };

  revalidatePath("/viajes");
  return { ok: true };
}

export async function saveDestinationAction(formData) {
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "Supabase no configurado" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para guardar." };

  const payload = {
    user_id: user.id,
    destination: formData.get("destination"),
    country: formData.get("country") || null,
    latitude: formData.get("lat") ? Number(formData.get("lat")) : null,
    longitude: formData.get("lon") ? Number(formData.get("lon")) : null,
  };

  const { error } = await supabase.from("saved_destinations").insert(payload);
  if (error) return { error: "No hemos podido guardar el destino." };

  revalidatePath("/favoritos");
  return { ok: true };
}

export async function deleteSavedAction(table, id) {
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "Supabase no configurado" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida" };

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: "No hemos podido eliminar." };

  revalidatePath("/viajes");
  revalidatePath("/favoritos");
  return { ok: true };
}
