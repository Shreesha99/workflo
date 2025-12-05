import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  const body = await req.json();

  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("projects")
    .update({
      name: body.name,
      client_name: body.client,
      client_email: body.email,
      status: body.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ project: data });
}
