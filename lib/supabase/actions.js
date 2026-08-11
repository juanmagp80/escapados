import { getSupabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";
import { findDestination } from "@/lib/destinations/catalog";
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

  const destination = String(formData.get("destination") || "");
  const catalog = findDestination(destination);
  const payload = {
    user_id: user.id,
    origin: formData.get("origin"),
    destination,
    slug: slugify(destination) || null,
    image: catalog?.image || null,
    start_date: formData.get("startDate") || null,
    end_date: formData.get("endDate") || null,
    travelers: Number(formData.get("travelers")) || 2,
    transport: formData.get("transport"),
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
  };

  const { error } = await supabase
    .from("trips")
    .upsert(payload, { onConflict: "user_id,origin,destination,start_date,end_date" });
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

  const { error } = await supabase
    .from("saved_destinations")
    .upsert(payload, { onConflict: "user_id,destination" });
  if (error) return { error: "No hemos podido guardar el destino." };

  revalidatePath("/favoritos");
  return { ok: true };
}

// Estado actual de un favorito (para saber si el botón debe mostrar "quitar").
export async function getDestinationSaved(destination) {
  const supabase = getSupabaseServer();
  if (!supabase || !destination) return { saved: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: false };

  const { data } = await supabase
    .from("saved_destinations")
    .select("id")
    .eq("user_id", user.id)
    .eq("destination", destination)
    .maybeSingle();

  return { saved: Boolean(data) };
}

// Añade o quita un favorito y devuelve el nuevo estado.
export async function toggleDestinationAction(formData) {
  const supabase = getSupabaseServer();
  if (!supabase) return { error: "Supabase no configurado" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para guardar." };

  const destination = String(formData.get("destination") || "");
  if (!destination) return { error: "Falta el destino." };

  const latitude = formData.get("lat") ? Number(formData.get("lat")) : null;
  const longitude = formData.get("lon") ? Number(formData.get("lon")) : null;

  const { data: existing } = await supabase
    .from("saved_destinations")
    .select("id")
    .eq("user_id", user.id)
    .eq("destination", destination)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_destinations")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: "No hemos podido quitar el favorito." };
    revalidatePath("/favoritos");
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("saved_destinations")
    .upsert(
      { user_id: user.id, destination, latitude, longitude },
      { onConflict: "user_id,destination" }
    );
  if (error) return { error: "No hemos podido guardar el destino." };
  revalidatePath("/favoritos");
  return { ok: true, saved: true };
}

const ALLOWED_DELETE_TABLES = {
  trips: "trips",
  saved_destinations: "saved_destinations",
};

export async function deleteSavedAction(table, id) {
  if (!ALLOWED_DELETE_TABLES[table]) return { error: "Operación no válida" };

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
