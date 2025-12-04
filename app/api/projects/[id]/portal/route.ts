import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server"; // ✅ Correct import
import { randomUUID } from "crypto";

export async function GET(req: Request, { params }: any) {
  try {
    const supabase = supabaseServer(); // ✅ Use correct function
    const projectId = params.id;

    // 1. Check if portal link already exists
    const { data: existing, error: existingError } = await supabase
      .from("project_portal_links")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }

    // If already exists → return the existing URL
    if (existing) {
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${existing.token}`,
      });
    }

    // 2. Create new token
    const token = randomUUID();

    const { error: insertError } = await supabase
      .from("project_portal_links")
      .insert({
        project_id: projectId,
        token,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 3. Return shareable link
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${token}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
