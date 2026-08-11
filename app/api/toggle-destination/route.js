import { NextResponse } from "next/server";
import {
  getDestinationSaved,
  toggleDestinationAction,
} from "@/lib/supabase/actions";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const destination = request.nextUrl.searchParams.get("destination") || "";
  const result = await getDestinationSaved(destination);
  return NextResponse.json(result);
}

export async function POST(request) {
  const formData = await request.formData();
  const result = await toggleDestinationAction(formData);
  return NextResponse.json(result);
}