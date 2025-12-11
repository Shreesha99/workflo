// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { email, username } = await req.json();

  if (!email || !username) {
    return NextResponse.json(
      { error: "Email and username are required." },
      { status: 400 }
    );
  }

  const tempPassword = crypto.randomUUID();

  const result = await supabase.auth.admin.listUsers();

  if (result.error) {
    return NextResponse.json(
      { error: "Server error checking existing users." },
      { status: 500 }
    );
  }

  const users = result.data.users as { email: string | null }[];

  const alreadyExists = users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (alreadyExists) {
    return NextResponse.json(
      { error: "Email already registered." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password`,
      data: {
        username,
        has_password: false,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    {
      message:
        "Account created successfully. Check your email to continue setup.",
      user: data?.user || null,
    },
    { status: 201 }
  );
}
