import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create a Supabase client compatible with async cookies()
export function supabaseRoute() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookies();       // FIX
          return store.get(name)?.value;       // FIX
        },
        async set(name: string, value: string, options: any) {
          const store = await cookies();       // FIX
          store.set(name, value, options);     // FIX
        },
        async remove(name: string, options: any) {
          const store = await cookies();       // FIX
          store.set(name, "", options);        // FIX
        }
      }
    }
  );
}

// Fetch currently authenticated user
export async function getUser() {
  const supabase = supabaseRoute();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
