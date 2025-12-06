"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EditProjectModal from "@/components/modals/EditProjectModal"; // ✅ NEW IMPORT
import styles from "./projectdetails.module.scss";

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const supabase = supabaseClient();

  const [project, setProject] = useState<any>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("Failed to load project.");
        return;
      }

      setProject(data);
    }

    load();
  }, [id]);

  async function deletePortalLink() {
    const { error } = await supabase
      .from("project_portal_links")
      .delete()
      .eq("project_id", id);

    if (error) {
      setError("Failed to delete portal link.");
      return;
    }
    setPortalUrl("");
  }

  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}`);

    if (!res.ok) {
      setError("Failed to generate portal link.");
      return;
    }

    const data = await res.json();
    setPortalUrl(data.url);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (error) return <ErrorMessage message={error} />;
  if (!project) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.container}>
      <ErrorMessage message={error} />

      <button
        className={styles.backBtn}
        onClick={() => router.push("/dashboard/projects")}
      >
        Back to Projects
      </button>

      <div className={styles.header}>
        <h1>{project.name}</h1>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className={`${styles.badge} ${styles[project.status]}`}>
            {project.status}
          </span>

          <button className={styles.editBtn} onClick={() => setEditOpen(true)}>
            Edit
          </button>
        </div>
      </div>

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
      </div>

      <div className={styles.portalSection}>
        <button className={styles.portalBtn} onClick={generatePortalLink}>
          Generate Client Portal Link
        </button>

        <button
          className={styles.deletePortalBtn}
          onClick={deletePortalLink}
          style={{
            background: "red",
            color: "white",
            padding: "8px 12px",
            marginTop: "10px",
          }}
        >
          Delete Portal Link
        </button>

        {portalUrl && (
          <div className={styles.portalBox}>
            <p>{portalUrl}</p>
            <button className={styles.copyBtn} onClick={copyToClipboard}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>Project Notes</h2>
        <p>Coming soon…</p>
      </div>

      {/* ✅ Replace old inline edit UI with clean modal */}
      {editOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => {
            setProject(updated);
            setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
