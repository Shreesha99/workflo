"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import styles from "./projects.module.scss";
import NewProjectModal from "@/components/modals/NewProjectModal";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { supabaseClient } from "@/lib/supabase/client";

export default function ProjectsPage() {
  const supabase = supabaseClient();

  const [projects, setProjects] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setApiError("Failed to load projects");
      return;
    }

    setApiError(null);
    setProjects(data || []);
  }

  // delete by id — calls server route at /api/projects/:id (DELETE)
  async function deleteProject(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        let msg = json?.error || "Delete failed";
        if (msg.includes("tasks_project_id_fkey")) {
          msg =
            "Cannot delete this project because tasks are still linked to it. Delete or reassign the tasks first.";
        } else if (msg.includes("files_project_id_fkey")) {
          msg =
            "Cannot delete this project because files are attached to it. Remove those files first.";
        } else if (msg.includes("approvals_project_id_fkey")) {
          msg =
            "Cannot delete this project because approvals exist for it. Remove those approvals first.";
        } else if (msg.includes("project_portal_links_project_id_fkey")) {
          msg =
            "Cannot delete this project because a portal link exists. Delete the portal link first.";
        }

        setApiError(msg);
        return;
      }

      // SUCCESS → remove from UI
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      setApiError("Network error while deleting project.");
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".project-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 }
    );
  }, [projects, search, activeFilter]);

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter ? p.status === activeFilter : true;
    return matchSearch && matchFilter;
  });

  const FILTERS = ["active", "pending", "completed"];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Projects</h1>

          {/* 🔥 Styled error message using your component */}
          <ErrorMessage message={apiError || ""} />
        </div>

        <button
          className={styles.newProjectBtn}
          onClick={() => setOpenModal(true)}
        >
          + New Project
        </button>
      </div>

      <div className={styles.searchFilters}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className={styles.icon}>🔍</span>
        </div>

        <div className={styles.pills}>
          {FILTERS.map((f) => (
            <div
              key={f}
              className={`${styles.pill} ${
                activeFilter === f ? styles.pillActive : ""
              }`}
              onClick={() => setActiveFilter(activeFilter === f ? "" : f)}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((p) => (
          <div key={p.id} className={`project-card ${styles.card}`}>
            <a href={`/dashboard/projects/${p.id}`}>
              <h3>{p.name}</h3>
              <p className={styles.client}>Client: {p.client_name}</p>
              <div className={styles.meta}>
                <span>Status: {p.status}</span>
                <span>Due: {p.due_date || "—"}</span>
              </div>
            </a>

            <button
              className={styles.deleteBtn}
              onClick={() => setDeleteTarget(p.id)}
            >
              Delete
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.emptyState}>No projects found.</div>
        )}
      </div>

      <NewProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadProjects}
      />

      <DeleteProjectModal
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(id) => deleteProject(id)}
      />
    </div>
  );
}
