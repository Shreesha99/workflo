import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  let supabase: any;

  try {
    supabase = await supabaseServer();
  } catch (err) {
    return NextResponse.json(
      { error: "Supabase server client error" },
      { status: 500 }
    );
  }

  try {
    const response = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?mode=onboarding`,
      },
    });

    if (response.error) {
      return NextResponse.json(
        { error: response.error.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "OTP sent" });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
