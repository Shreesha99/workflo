"use client";

import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function SuccessCallback() {
  useEffect(() => {
    async function handle() {
      const supabase = supabaseClient();
      const { data } = await supabase.auth.getUser();

      const user = data.user;
      if (!user) return;

      const hasPassword = !!user.user_metadata?.has_password;
      if (!hasPassword) {
        window.location.href = "/auth/set-password";
        return;
      }

      window.location.href = "/dashboard";
    }

    handle();
  }, []);

  return <p>Loading…</p>;
}
