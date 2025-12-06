"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage"; // ✅ ADDED
import styles from "./projectdetails.module.scss";

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const supabase = supabaseClient();

  const [project, setProject] = useState<any>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(""); // will be shown using ErrorMessage

  // NEW — edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editClient, setEditClient] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

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
      setEditName(data.name);
      setEditClient(data.client_name || "");
      setEditEmail(data.client_email || "");
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

  async function saveEdits() {
    setSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name: editName,
        client_name: editClient,
        client_email: editEmail,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      setError("Failed to update project.");
      return;
    }

    setProject({
      ...project,
      name: editName,
      client_name: editClient,
      client_email: editEmail,
    });

    setEditOpen(false);
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
      {/* NOTES */}
      <div className={styles.section}>
        <h2>Project Notes</h2>
        <p>Coming soon…</p>
      </div>
      {/* EDIT MODAL */}
      {editOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Edit Project</h2>

            <label>Project Name</label>
            <input
              className={styles.input}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <label>Client Name</label>
            <input
              className={styles.input}
              value={editClient}
              onChange={(e) => setEditClient(e.target.value)}
            />

            <label>Client Email</label>
            <input
              className={styles.input}
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>

              <button
                className={styles.saveBtn}
                disabled={saving}
                onClick={saveEdits}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
