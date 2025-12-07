"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import styles from "./projects.module.scss";

import NewProjectModal from "@/components/modals/NewProjectModal";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";
import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";

import { supabaseClient } from "@/lib/supabase/client";
import { Trash2, Filter, Search, Plus } from "lucide-react";

export default function ProjectsPage() {
  const supabase = supabaseClient();

  const [projects, setProjects] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [clientFilter, setClientFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const steps = [
    {
      id: "search",
      text: "You can search projects here.",
      attachTo: { element: ".searchBar", on: "bottom" },
      buttons: [{ text: "Next", action: (tour) => tour.next() }],
    },
    {
      id: "filters",
      text: "Filter your projects using these pills.",
      attachTo: { element: ".pills", on: "bottom" },
      buttons: [{ text: "Next", action: (tour) => tour.next() }],
    },
    {
      id: "cards",
      text: "All your projects appear here.",
      attachTo: { element: ".grid", on: "top" },
      buttons: [{ text: "Next", action: (tour) => tour.next() }],
    },
    {
      id: "newProject",
      text: "Create a new project with this button.",
      attachTo: { element: ".floatingNewProjectBtn", on: "top" },
      buttons: [{ text: "Finish", action: (tour) => tour.complete() }],
    },
  ];

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return setApiError("Failed to load projects");
    setProjects(data || []);
  }

  async function deleteProject(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) return setApiError(json?.error || "Failed to delete project");

    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".project-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }
    );
  }, [projects, search, statusFilter, clientFilter, dueFilter]);

  const uniqueClients = [
    ...new Set(projects.map((p) => p.client_name).filter(Boolean)),
  ];

  const today = new Date();

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? p.status === statusFilter : true;
    const matchClient = clientFilter ? p.client_name === clientFilter : true;

    let matchDue = true;
    if (dueFilter === "upcoming")
      matchDue = p.due_date && new Date(p.due_date) > today;
    if (dueFilter === "overdue")
      matchDue = p.due_date && new Date(p.due_date) < today;
    if (dueFilter === "none") matchDue = !p.due_date;

    return matchSearch && matchStatus && matchClient && matchDue;
  });

  const STATUS = ["active", "pending", "completed"];

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Projects</h1>
      </div>

      <ErrorMessage message={apiError || ""} />

      {/* 🔥 UNIFIED CONTROL BAR */}
      <div className={styles.filtersRow}>
        {/* Search */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} className={styles.searchIcon} />
        </div>

        {/* Status Pills */}
        <div className={styles.pills}>
          {STATUS.map((s) => (
            <div
              key={s}
              className={`${styles.pill} ${
                statusFilter === s ? styles.pillActive : ""
              }`}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Unified Filter Button */}
        <div className={styles.filterWrap}>
          <button
            className={styles.filterBtn}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <Filter size={16} /> Filters
          </button>

          {filtersOpen && (
            <div className={styles.filterDropdown}>
              {/* Client section */}
              <div className={styles.dropdownSection}>
                <label>Client</label>

                {uniqueClients.map((c) => (
                  <div
                    key={c}
                    className={`${styles.dropdownItem} ${
                      clientFilter === c ? styles.activeItem : ""
                    }`}
                    onClick={() => setClientFilter(c)}
                  >
                    {c}
                  </div>
                ))}

                <div
                  className={styles.dropdownClear}
                  onClick={() => setClientFilter("")}
                >
                  Clear
                </div>
              </div>

              <div className={styles.divider}></div>

              {/* Due Date section */}
              <div className={styles.dropdownSection}>
                <label>Due Date</label>

                <div
                  className={`${styles.dropdownItem} ${
                    dueFilter === "upcoming" ? styles.activeItem : ""
                  }`}
                  onClick={() => setDueFilter("upcoming")}
                >
                  Upcoming
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    dueFilter === "overdue" ? styles.activeItem : ""
                  }`}
                  onClick={() => setDueFilter("overdue")}
                >
                  Overdue
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    dueFilter === "none" ? styles.activeItem : ""
                  }`}
                  onClick={() => setDueFilter("none")}
                >
                  No Due Date
                </div>

                <div
                  className={styles.dropdownClear}
                  onClick={() => setDueFilter("")}
                >
                  Clear
                </div>
              </div>

              {/* CLEAR ALL */}
              <button
                className={styles.clearAllBtn}
                onClick={() => {
                  setClientFilter("");
                  setDueFilter("");
                  setStatusFilter("");
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.map((p) => (
          <div key={p.id} className={`project-card ${styles.card}`}>
            <button
              className={styles.deleteIcon}
              onClick={() => setDeleteTarget(p.id)}
            >
              <Trash2 size={16} />
            </button>

            <a href={`/dashboard/projects/${p.id}`} className={styles.cardBody}>
              <h3>{p.name}</h3>
              <p className={styles.clientRow}>Client: {p.client_name || "—"}</p>

              <div className={styles.metaRow}>
                <StatusBadge status={p.status} />
                <span className={styles.dueWrap}>Due: {p.due_date || "—"}</span>
              </div>
            </a>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>No projects match these filters.</div>
        )}
      </div>

      {/* MODALS */}
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
      <button className={styles.fab} onClick={() => setOpenModal(true)}>
        <Plus size={30} />
      </button>
    </div>
  );
}
