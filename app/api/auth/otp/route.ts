import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json();
  const supabase = supabaseServer();

  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: "OTP sent" });
}
