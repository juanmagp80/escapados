import { saveDestinationAction } from "@/lib/supabase/actions";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const formData = await request.formData();
  const result = await saveDestinationAction(formData);
  return Response.json(result);
}
