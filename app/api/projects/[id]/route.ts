import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req, context) {
  const params = await context.params; // ← correct
  const id = params.id; // ← now works

  const supabase = await supabaseServer();
  const body = await req.json();

  console.log("🆔 PROJECT ID:", id);

  const updatePayload = {
    name: body.name,
    client_name: body.client,
    client_email: body.email,
    status: body.status,
    due_date: body.due_date,
  };

  console.log("🔧 UPDATE PAYLOAD:", updatePayload);

  const { data, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("❌ UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ project: data });
}

/* ---------------------- GENERATE PORTAL LINK (GET) ---------------------- */
export async function GET(req: Request, context: any) {
  const { id: projectId } = await context.params; // ← IMPORTANT

  const supabase = await supabaseServer();

  if (!projectId) {
    return NextResponse.json({ error: "Project ID missing" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("project_portal_links")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  let token = existing?.token;

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

export async function DELETE(req: Request, context: any) {
  const { id } = await context.params;

  const supabase = await supabaseServer();
  const portalDelete = await supabase
    .from("project_portal_links")
    .delete()
    .eq("project_id", id);

  if (portalDelete.error) {
    return NextResponse.json(
      { error: "Failed to delete portal links: " + portalDelete.error.message },
      { status: 500 }
    );
  }

  const projectDelete = await supabase.from("projects").delete().eq("id", id);

  if (projectDelete.error) {
    return NextResponse.json(
      { error: "Failed to delete project: " + projectDelete.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
