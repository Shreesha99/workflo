// app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

/* ---------------------------------------------- */
/*   POST → Update project OR Add chat message    */
/* ---------------------------------------------- */
export async function POST(req: Request, context: any) {
  const url = new URL(req.url);
  const isChat = url.searchParams.get("chat") === "true";
  const { id } = await context.params;
  const supabase = await supabaseServer();
  const body = await req.json();

  /* --------------------- CHAT MESSAGE --------------------- */
  if (isChat) {
    const { message, author = "Admin" } = body;

    const { data, error } = await supabase
      .from("project_chat")
      .insert({
        project_id: id,
        message,
        author,
      })
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ message: data });
  }

  /* --------------------- PROJECT UPDATE --------------------- */

  const updatePayload = {
    name: body.name,
    client_name: body.client,
    client_email: body.email,
    status: body.status,
    due_date: body.due_date,
  };

  const { data, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ project: data });
}

/* ---------------------------------------------- */
/*   GET → Notes OR Portal OR Chat               */
/* ---------------------------------------------- */
export async function GET(req: Request, context: any) {
  const { id: projectId } = await context.params;
  const url = new URL(req.url);

  const wantNotes = url.searchParams.get("notes") === "true";
  const wantChat = url.searchParams.get("chat") === "true";

  const supabase = await supabaseServer();

  if (!projectId)
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  /* -------------------- CHAT --------------------- */
  if (wantChat) {
    const { data, error } = await supabase
      .from("project_chat")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data });
  }

  /* -------------------- NOTES --------------------- */
  if (wantNotes) {
    const { data, error } = await supabase
      .from("project_notes")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data });
  }

  /* ---------------- PORTAL (default GET) ----------- */
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

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

    if (error)
      return NextResponse.json(
        { error: "Failed to create portal link" },
        { status: 500 }
      );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({ url: `${base}/portal/${token}` });
}

/* ---------------------------------------------- */
/*   DELETE → delete project + portal link        */
/* ---------------------------------------------- */
export async function DELETE(req: Request, context: any) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  await supabase.from("project_portal_links").delete().eq("project_id", id);

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error)
    return NextResponse.json(
      { error: "Failed to delete: " + error.message },
      { status: 500 }
    );

  return NextResponse.json({ success: true });
}

/* ---------------------------------------------- */
/*   PATCH → ADD NOTE (same as before)            */
/* ---------------------------------------------- */
export async function PATCH(req: Request, context: any) {
  const { id: projectId } = await context.params;
  const supabase = await supabaseServer();
  const body = await req.json();

  const { note_text } = body;

  const { data, error } = await supabase
    .from("project_notes")
    .insert({
      project_id: projectId,
      note_text,
    })
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ note: data });
}

/* ---------------------------------------------- */
/*   PUT → UPDATE NOTE (same as before)           */
/* ---------------------------------------------- */
export async function PUT(req: Request, context: any) {
  const { id: noteId } = await context.params;
  const supabase = await supabaseServer();
  const body = await req.json();

  const { note_text } = body;

  const { data, error } = await supabase
    .from("project_notes")
    .update({
      note_text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ note: data });
}

/* ---------------------------------------------- */
/*   POST ?chat=true → ADD CHAT MESSAGE           */
/* ---------------------------------------------- */
export async function POST_CHAT(req: Request, context: any) {
  // ❗ NEXT DOES NOT SUPPORT FUNCTION OVERLOAD BASED ON QUERY,
  // so we detect inside POST using url params.

  const url = new URL(req.url);
  const isChat = url.searchParams.get("chat") === "true";

  if (!isChat) return; // Let original POST handle project update

  const { id: projectId } = await context.params;
  const supabase = await supabaseServer();
  const body = await req.json();

  const { message, author = "Admin" } = body;

  const { data, error } = await supabase
    .from("project_chat")
    .insert({
      project_id: projectId,
      message,
      author,
    })
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: data });
}
