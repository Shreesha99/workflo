"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function ClientPortal() {
  const { token } = useParams() as { token: string };
  const supabase = supabaseClient();

  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!token) {
        setError("Invalid portal link.");
        return;
      }

      // 1️⃣ Validate token → get project_id
      const { data: portalEntry } = await supabase
        .from("project_portal_links")
        .select("project_id")
        .eq("token", token)
        .maybeSingle();

      if (!portalEntry) {
        setError("Invalid or expired portal link.");
        return;
      }

      // 2️⃣ Fetch the actual project
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", portalEntry.project_id)
        .single();

      if (!projectData) {
        setError("Project not found.");
        return;
      }

      setProject(projectData);
    }

    load();
  }, [token]);

  if (error) return <p>{error}</p>;
  if (!project) return <p>Loading…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Client Portal</h1>
      <h2>{project.name}</h2>

      <p>Status: {project.status}</p>
      <p>Client: {project.client_name}</p>
      <p>Email: {project.client_email}</p>

      <hr />

      <p>Client Portal UI coming soon…</p>
    </div>
  );
}
