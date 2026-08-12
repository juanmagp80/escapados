import PushNotificationsToggle from "@/components/common/PushNotificationsToggle";
import Achievements from "@/components/profile/Achievements";
import PreferencesForm from "@/components/profile/PreferencesForm";
import { findDestination } from "@/lib/destinations/catalog";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login?next=/perfil");

    const supabase = getSupabaseServer();
    let preferences = {};
    let stats = { trips: 0, coastTrips: 0, interiorTrips: 0, destinations: 0, published: 0 };
    if (supabase) {
        const [prefsRes, tripsRes, publishedRes] = await Promise.all([
            supabase
                .from("preferences")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase.from("trips").select("id, destination").eq("user_id", user.id),
            supabase
                .from("published_trips")
                .select("id")
                .eq("user_id", user.id),
        ]);
        preferences = prefsRes.data || {};
        const trips = tripsRes.data || [];
        const published = publishedRes.data || [];
        const uniqueDestinations = new Set(trips.map((t) => t.destination));
        stats = {
            trips: trips.length,
            coastTrips: trips.filter((t) => findDestination(t.destination)?.region === "costa").length,
            interiorTrips: trips.filter((t) => findDestination(t.destination)?.region === "interior").length,
            destinations: uniqueDestinations.size,
            published: published.length,
        };
    }

    return (
        <main className="container-narrow py-8">
            <h1 className="mb-6 text-3xl font-extrabold text-ink">
                👤 Tu perfil
            </h1>
            <p className="mb-6 text-sm text-stone-500">
                Configura tus preferencias por defecto para que las escapadas se
                adapten a vosotros.
            </p>
            <div className="space-y-6">
                <Achievements stats={stats} />
                <PreferencesForm preferences={preferences} />
                <div className="card p-5">
                    <h2 className="mb-1 text-lg font-bold text-ink">
                        🔔 Notificaciones
                    </h2>
                    <p className="mb-3 text-sm text-stone-500">
                        Recibe alertas de precio y cambios de meteorología en tu
                        dispositivo (PWA instalable).
                    </p>
                    <PushNotificationsToggle />
                </div>
            </div>
        </main>
    );
}
