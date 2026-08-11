"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function useSupabase() {
  const [client] = useState(() =>
    url && anonKey ? createBrowserClient(url, anonKey) : null
  );
  return client;
}
