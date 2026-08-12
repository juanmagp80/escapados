import ShareTripView from "@/components/compartir/ShareTripView";
import { getSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompartirPage({ params }) {
    const supabase = getSupabaseServer();
    if (!supabase) return notFound();

    const { data: trip } = await supabase
        .from("shared_trips")
        .select("*")
        .eq("slug", params.slug)
        .maybeSingle();

    if (!trip) return notFound();

    return (
        <main className="container-app">
            <ShareTripView trip={trip} />
        </main>
    );
}