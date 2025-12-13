"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Loader from "@/components/ui/Loader";

export default function CallbackClient() {
  const params = useSearchParams();
  const error = params.get("error_code");
  const supabase = supabaseClient();
  const [countdown, setCountdown] = useState(5);

  // expired magic link
  useEffect(() => {
    if (error === "otp_expired") {
      const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
      const timeout = setTimeout(() => {
        window.location.href = "/auth/otp";
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [error]);

  // valid magic link
  useEffect(() => {
    async function process() {
      if (error === "otp_expired") return;

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return; // wait for Supabase

      const hasPassword = !!user.user_metadata?.has_password;

      if (!hasPassword) {
        window.location.href = "/auth/set-password";
        return;
      }

      window.location.href = "/dashboard";
    }

    process();
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

  return <Loader />;
}
