"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function CallbackPage() {
  const params = useSearchParams();
  const error = params.get("error_code");
  const [countdown, setCountdown] = useState(5);
  const supabase = supabaseClient();

  // ----------------------------
  // EXPIRED LINK FLOW
  // ----------------------------
  useEffect(() => {
    if (error === "otp_expired") {
      const intv = setInterval(() => setCountdown((c) => c - 1), 1000);
      const timeout = setTimeout(() => {
        window.location.href = "/auth/otp";
      }, 5000);

      return () => {
        clearInterval(intv);
        clearTimeout(timeout);
      };
    }
  }, [error]);

  // ----------------------------
  // VALID MAGIC LINK FLOW
  // ----------------------------
  useEffect(() => {
    async function processLogin() {
      if (error === "otp_expired") return;

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return; // Supabase may take a moment

      const hasPassword = !!user.user_metadata?.has_password;

      if (!hasPassword) {
        window.location.href = "/auth/set-password";
        return;
      }

      window.location.href = "/dashboard";
    }

    processLogin();
  }, [error]);

  if (error === "otp_expired") {
    return (
      <div>
        <ErrorMessage message="This magic link has expired." />
        <p>
          Redirecting in <strong>{countdown}</strong>…
        </p>
      </div>
    );
  }

  return <p>Loading…</p>;
}
