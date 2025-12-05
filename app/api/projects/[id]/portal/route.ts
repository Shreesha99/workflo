import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 🔥 FIX: unwrap params (because in Next 16 params is a Promise)
  const { id: projectId } = await context.params;

  const supabase = await supabaseServer();

  if (!projectId) {
    return NextResponse.json({ error: "Project ID missing" }, { status: 400 });
  }

  // 1️⃣ Check project exists
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 2️⃣ Check existing portal link
  const { data: existing } = await supabase
    .from("project_portal_links")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  let token = existing?.token;

  // 3️⃣ Create new token if missing
  if (!token) {
    token = randomUUID();

    const { error } = await supabase.from("project_portal_links").insert({
      project_id: projectId,
      token,
      allow_comments: true,
      allow_uploads: true,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create portal link" },
        { status: 500 }
      );
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${base}/portal/${token}`;

  return NextResponse.json({ url });
}
