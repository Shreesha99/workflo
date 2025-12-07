"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";

import styles from "./ClientPortal.module.scss";

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

      const { data: portalEntry } = await supabase
        .from("project_portal_links")
        .select("project_id")
        .eq("token", token)
        .maybeSingle();

      if (!portalEntry) {
        setError("Invalid or expired portal link.");
        return;
      }

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

  if (error)
    return (
      <div className={styles.portalContainer}>
        <ErrorMessage message={error} />
      </div>
    );

  if (!project)
    return (
      <div className={styles.portalContainer}>
        <p>Loading…</p>
      </div>
    );

  return (
    <div className={styles.portalContainer}>
      {/* HEADER */}
      <div className={styles.portalHeader}>
        <h1>{project.name}</h1>
        <span
          className={`${styles.status} ${styles[project.status.toLowerCase()]}`}
        >
          {project.status}
        </span>
      </div>

      {/* INFO CARD */}
      <div className={styles.infoCard}>
        <p>
          <strong>Client:</strong> {project.client_name || "—"}
        </p>
        <p>
          <strong>Email:</strong> {project.client_email || "—"}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {new Date(project.created_at).toLocaleDateString()}
        </p>
        <p>
          <strong>Due Date:</strong>{" "}
          {project.due_date
            ? new Date(project.due_date).toLocaleDateString()
            : "—"}
        </p>
      </div>

      {/* SECTION */}
      <div className={styles.section}>
        <h2>Client Portal</h2>
        <p>
          This portal will soon allow you to track project updates, files, and
          timelines.
        </p>
      </div>
    </div>
  );
}
