import { deleteSavedAction } from "@/lib/supabase/actions";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const formData = await request.formData();
  const result = await deleteSavedAction(
    formData.get("table"),
    formData.get("id")
  );
  return Response.json(result);
}