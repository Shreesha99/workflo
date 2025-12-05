import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.log("📩 OTP API HIT");

  let body;
  try {
    body = await req.json();
    console.log("📨 Request Body:", body);
  } catch (err) {
    console.error("❌ Failed to parse JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email } = body;

  if (!email) {
    console.error("❌ Email missing in body");
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  console.log("🔧 Creating Supabase server client...");
  let supabase: any;

  try {
    supabase = await supabaseServer();
  } catch (err) {
    console.error("❌ Failed to create supabase server client:", err);
    return NextResponse.json(
      { error: "Supabase server client error" },
      { status: 500 }
    );
  }

  console.log("📨 Sending OTP email to:", email);

  try {
    const response = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?mode=onboarding`
      },
    });

    console.log("📥 Supabase OTP Response:", response);

    if (response.error) {
      console.error("❌ Supabase OTP Error:", response.error);
      return NextResponse.json(
        { error: response.error.message },
        { status: 400 }
      );
    }

    console.log("✅ OTP successfully sent!");
    return NextResponse.json({ message: "OTP sent" });
  } catch (err) {
    console.error("🔥 Unexpected error during signInWithOtp:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
