import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// This runs BEFORE the client page — Supabase can complete the PKCE flow properly here.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error_code");

  if (!code && error === "otp_expired") {
    return NextResponse.redirect("/auth/callback/expired");
  }

  // Let Supabase exchange the code for a session
  const supabase = await supabaseServer();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code ?? "");

  if (exchangeError) {
    console.error("Exchange failed:", exchangeError.message);
    return NextResponse.redirect("/auth/callback/expired");
  }

  return NextResponse.redirect("/auth/callback/success");
}
