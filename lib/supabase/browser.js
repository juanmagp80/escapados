"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function useSupabase() {
  const [client] = useState(() =>
    url && anonKey ? createClient(url, anonKey) : null
  );
  return client;
}
