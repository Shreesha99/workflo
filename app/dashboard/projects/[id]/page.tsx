"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

import ErrorMessage from "@/components/ui/ErrorMessage";
import EditProjectModal from "@/components/modals/EditProjectModal";
import StatusBadge from "@/components/ui/StatusBadge";

import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  Link2,
  Check,
  XCircle,
} from "lucide-react";

import styles from "./projectdetails.module.scss";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const supabase = supabaseClient();

  const [project, setProject] = useState<any>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const steps = [
    {
      id: "back",
      text: "Use this to go back to Projects.",
      attachTo: { element: ".backBtn", on: "right" },
      buttons: [{ text: "Next", action: (t) => t.next() }],
    },
    {
      id: "title",
      text: "This is your project name and status.",
      attachTo: { element: ".header", on: "bottom" },
      buttons: [{ text: "Next", action: (t) => t.next() }],
    },
    {
      id: "info",
      text: "Basic client info is displayed here.",
      attachTo: { element: ".infoCard", on: "top" },
      buttons: [{ text: "Next", action: (t) => t.next() }],
    },
    {
      id: "portal",
      text: "Generate or manage a client portal link here.",
      attachTo: { element: ".portalDisplay, .actionBarFloating", on: "top" },
      buttons: [{ text: "Next", action: (t) => t.next() }],
    },
    {
      id: "actions",
      text: "All project actions appear here.",
      attachTo: { element: ".actionBarFloating", on: "top" },
      buttons: [{ text: "Finish", action: (t) => t.complete() }],
    },
  ];

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

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return setError("Failed to load project.");

      setProject(data);
      loadPortalLink();
    }

    load();
  }, [id]);

  // ACTIONS
  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) return setError("Failed to generate portal link.");

    const json = await res.json();
    setPortalUrl(json.url);
  }

  async function removePortalLink() {
    await supabase.from("project_portal_links").delete().eq("project_id", id);

    setPortalUrl("");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!project) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.container}>
      {/* BACK BUTTON */}
      <button
        className={styles.backBtn}
        onClick={() => router.push("/dashboard/projects")}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
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

      {/* PORTAL LINK DISPLAY (centered above action bar) */}
      {portalUrl && (
        <div className={styles.portalDisplay}>
          <p>{portalUrl}</p>
        </div>
      )}

      {/* FLOATING ACTION BAR */}
      <div className={styles.actionBarFloating}>
        {/* EDIT */}
        <button className={styles.actionBtn} onClick={() => setEditOpen(true)}>
          <Pencil size={16} /> Edit
        </button>

        {/* GENERATE / COPY LINK */}
        {!portalUrl ? (
          <button className={styles.actionBtn} onClick={generatePortalLink}>
            <Link2 size={16} /> Generate Link
          </button>
        ) : (
          <button className={styles.actionBtn} onClick={copyToClipboard}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        )}

        {/* REMOVE LINK (only if exists) */}
        {portalUrl && (
          <button className={styles.actionBtnDanger} onClick={removePortalLink}>
            <XCircle size={16} /> Remove Link
          </button>
        )}

        {/* DELETE PROJECT */}
        <button
          className={styles.actionBtnDanger}
          onClick={() => setDeleteTarget(project.id)}
        >
          <Trash2 size={16} /> Delete
        </button>
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

      <DeleteProjectModal
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (id) => {
          await fetch(`/api/projects/${id}`, { method: "DELETE" });
          router.push("/dashboard/projects");
        }}
      />
    </div>
  );
}
