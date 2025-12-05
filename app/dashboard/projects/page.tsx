"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import styles from "./projects.module.scss";
import NewProjectModal from "@/components/modals/NewProjectModal";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";
import { supabaseClient } from "@/lib/supabase/client";

export default function ProjectsPage() {
  const supabase = supabaseClient();

  const [projects, setProjects] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    setProjects(data || []);
  }

  async function deleteProject(id: string) {
    const res = await fetch(`/api/projects/${id}/delete`, {
      method: "DELETE",
    });

    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeleteTarget(null);
    } else {
      console.error("Delete failed");
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
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Projects</h1>
        <button
          className={styles.newProjectBtn}
          onClick={() => setOpenModal(true)}
        >
          + New Project
        </button>
      </div>

      {/* SEARCH + FILTER */}
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

      {/* GRID */}
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
      </div>

      <NewProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadProjects}
      />

      <DeleteProjectModal
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteProject}
      />
    </div>
  );
}
