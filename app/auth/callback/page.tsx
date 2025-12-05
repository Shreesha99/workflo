"use client";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // or "nodejs"
export const revalidate = 0;

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";

function CallbackInner() {
  const params = useSearchParams();
  const error = params.get("error_code");
  const [countdown, setCountdown] = useState(5);
  const supabase = supabaseClient();

  // ----------------------------
  // EXPIRED LINK HANDLING
  // ----------------------------
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

  // ----------------------------
  // NORMAL MAGIC LINK LOGIN FLOW
  // ----------------------------
  useEffect(() => {
    async function processLogin() {
      if (error === "otp_expired") return;

      // Give Supabase time to finalize login
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

    processLogin();
  }, [error]);

  // ----------------------------
  // UI
  // ----------------------------
  if (error === "otp_expired") {
    return (
      <div>
        <ErrorMessage message="This magic link has expired." />
        <p>
          Redirecting in <strong>{countdown}</strong> seconds…
        </p>
      </div>
    );
  }

  return <p>Loading…</p>;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <CallbackInner />
    </Suspense>
  );
}
