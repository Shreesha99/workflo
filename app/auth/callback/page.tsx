"use client";

import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function Callback() {
  const supabase = supabaseClient();

  useEffect(() => {
    async function finishLogin() {
      const { data } = await supabase.auth.getSession();

      if (data?.session) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/auth/login";
      }
    }

    finishLogin();
  }, []);

  return (
    <p style={{ textAlign: "center", marginTop: 40 }}>Finishing login...</p>
  );
}
