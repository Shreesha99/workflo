// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: "Email, username and password are required." },
      { status: 400 }
    );
  }

  // ----- 1️⃣ CHECK IF USER ALREADY EXISTS (ADMIN API) -----
  const result = await supabase.auth.admin.listUsers();

  if (result.error) {
    return NextResponse.json(
      { error: "Server error checking existing users." },
      { status: 500 }
    );
  }

  const existingUsers = result.data as {
    users: { email: string | null }[];
  };

  const alreadyExists = existingUsers.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (alreadyExists) {
    return NextResponse.json(
      { error: "Email already registered." },
      { status: 409 }
    );
  }

  // ----- 2️⃣ CREATE USER -----
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      message:
        "Account created successfully. Check your email for verification.",
      user: data?.user || null,
    },
    { status: 201 }
  );
}
