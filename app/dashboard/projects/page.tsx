"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import styles from "./projects.module.scss";
import NewProjectModal from "@/components/modals/NewProjectModal";
import { supabaseClient } from "@/lib/supabase/client";

export default function ProjectsPage() {
  const supabase = supabaseClient();

  const [projects, setProjects] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    setProjects(data || []);
  }

  // useEffect(() => {
  //   loadProjects();
  // }, []);

  useEffect(() => {
    gsap.fromTo(
      ".project-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 }
    );
  }, [projects]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Projects</h1>

        <div className={styles.right}>
          <button
            className={styles.newProjectBtn}
            onClick={() => setOpenModal(true)}
          >
            + New Project
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.map((p) => (
          <a
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className={`project-card ${styles.card}`}
          >
            <h3>{p.name}</h3>
            <p className={styles.client}>Client: {p.client}</p>

            <div className={styles.meta}>
              <span>Status: {p.status}</span>
              <span>Due: {p.due_date || "—"}</span>
            </div>
          </a>
        ))}
      </div>

      {/* MODAL */}
      <NewProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadProjects}
      />
    </div>
  );
}
