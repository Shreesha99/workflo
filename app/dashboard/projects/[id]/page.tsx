"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EditProjectModal from "@/components/modals/EditProjectModal";

import { ArrowLeft, Pencil, Trash2, Copy, Link2, Check } from "lucide-react";

import styles from "./projectdetails.module.scss";
import StatusBadge from "@/components/ui/StatusBadge";

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
      await loadPortalLink();
    }

    load();
  }, [id]);

  async function loadPortalLink() {
    const { data } = await supabase
      .from("project_portal_links")
      .select("token")
      .eq("project_id", id)
      .maybeSingle();

    if (data?.token) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      setPortalUrl(`${base}/portal/${data.token}`);
    }
  }

  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) return setError("Failed to generate portal link.");
    const data = await res.json();
    setPortalUrl(data.url);
  }

  async function deletePortalLink() {
    const { error } = await supabase
      .from("project_portal_links")
      .delete()
      .eq("project_id", id);

    if (error) return setError("Failed to delete portal link.");
    setPortalUrl("");
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

      {/* BACK BUTTON WITH ICON */}
      <button
        className={styles.backBtn}
        onClick={() => router.push("/dashboard/projects")}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* HEADER */}
      <div className={styles.header}>
        <h1>{project.name}</h1>

        <div className={styles.headerRight}>
          <StatusBadge status={project.status} />

          {/* EDIT ICON BUTTON */}
          <button className={styles.iconBtn} onClick={() => setEditOpen(true)}>
            <Pencil size={18} />
          </button>
        </div>
      </div>

      {/* PROJECT INFO */}
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

      {/* PORTAL AREA */}
      <div className={styles.portalSection}>
        {/* GENERATE LINK (ICON BUTTON) */}
        <button
          className={styles.primaryIconBtn}
          onClick={generatePortalLink}
          disabled={!!portalUrl}
        >
          <Link2 size={17} />
          {portalUrl ? "Link Ready" : "Generate Link"}
        </button>

        {/* PORTAL BOX */}
        {portalUrl && (
          <div className={styles.portalBox}>
            <p>{portalUrl}</p>

            <div className={styles.portalActions}>
              {/* COPY ICON */}
              <button className={styles.smallIconBtn} onClick={copyToClipboard}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>

              {/* DELETE ICON */}
              <button
                className={styles.smallIconDangerBtn}
                onClick={deletePortalLink}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NOTES SECTION */}
      <div className={styles.section}>
        <h2>Project Notes</h2>
        <p>Coming soon…</p>
      </div>

      {/* EDIT MODAL */}
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
