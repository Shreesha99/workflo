import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const supabase = supabaseServer();

  // 1️⃣ Lookup profile → get user_id
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (profileError || !profile)
    return NextResponse.json({ error: "Username not found" }, { status: 404 });

  const userId = profile.id;

  // 2️⃣ Fetch email from auth.users
  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(userId);

  if (userError || !userData)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const email = userData.user.email;

  // 3️⃣ Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ user: data.user });
}
