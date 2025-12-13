"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import styles from "./projects.module.scss";

import NewProjectModal from "@/components/modals/NewProjectModal";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";
import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";

import { supabaseClient } from "@/lib/supabase/client";
import {
  Trash2,
  Filter,
  Search,
  Plus,
  Columns,
  List as ListIcon,
} from "lucide-react";

import KanbanBoard, { KanbanItem } from "@/components/ui/KanbanBoard";

// =======================================
// PROJECT TYPE EXTENDS KANBAN ITEM
// =======================================
type Project = KanbanItem & {
  name: string;
  client_name?: string | null;
  status: "active" | "pending" | "completed";
  created_at?: string;
  due_date?: string | null;
};

export default function ProjectsPage() {
  const supabase = supabaseClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const filterRef = useRef<HTMLDivElement | null>(null);

  // Column statuses for kanban (correct order)
  const STATUS: Array<Project["status"]> = ["active", "pending", "completed"];

  // close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        filtersOpen &&
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersOpen]);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return setApiError("Failed to load projects");
    setProjects((data as Project[]) || []);
  }

  async function deleteProject(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) return setApiError("Failed to delete project");
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  }

  // GSAP animation
  useEffect(() => {
    gsap.fromTo(
      ".project-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }
    );
  }, [projects, search, statusFilter, clientFilter, dueFilter, viewMode]);

  // Unique client filters
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

  // Debounced search
  useEffect(() => {
    const h = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  // ============================================================
  // SMALL COMPONENTS PASSED INTO KANBAN BOARD -------------------
  // ============================================================

  function ProjectCard({ p }: { p: Project }) {
    return (
      <div className={`project-card ${styles.card}`}>
        <button
          className={styles.deleteIcon}
          onClick={() => setDeleteTarget(p.id)}
        >
          <span title="Delete project">
            <Trash2 size={16} />
          </span>
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
    );
  }

  function ProjectOverlayCard({ p }: { p: Project }) {
    return (
      <div className={`${styles.card} ${styles.dragOverlay}`}>
        <div className={styles.cardBody}>
          <h3>{p.name}</h3>
        </div>
      </div>
    );
  }

  // ============================================================
  // UPDATE STATUS CALLBACK FOR KANBAN BOARD
  // ============================================================
  async function handleStatusChange(id: string, newStatus: Project["status"]) {
    const old = projects;

    // optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );

    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) setProjects(old); // rollback
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Projects</h1>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.smallIconBtn} ${
              viewMode === "list" ? styles.smallIconBtnActive : ""
            }`}
            onClick={() => setViewMode("list")}
          >
            <span title="List view">
              <ListIcon size={16} />
            </span>
          </button>
          <button
            className={`${styles.smallIconBtn} ${
              viewMode === "kanban" ? styles.smallIconBtnActive : ""
            }`}
            onClick={() => setViewMode("kanban")}
          >
            <span title="Kanban board view">
              <Columns size={16} />
            </span>
          </button>
        </div>
      </div>

      <ErrorMessage message={apiError || ""} />

      {/* FILTER BAR */}
      <div className={styles.filtersRow}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search size={16} className={styles.searchIcon} />
        </div>

        {viewMode === "list" && (
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
        )}

        {/* FILTERS DROPDOWN */}
        <div className={styles.filterWrap}>
          <button
            className={styles.filterBtn}
            onClick={() => setFiltersOpen((p) => !p)}
          >
            <span title="Open filters">
              <Filter size={16} />
            </span>
            Filters
          </button>

          {filtersOpen && (
            <div ref={filterRef} className={styles.filterDropdown}>
              {/* close */}
              <div
                className={styles.filterCloseBtn}
                onClick={() => setFiltersOpen(false)}
                title="Close filters"
              >
                ✕
              </div>

              {/* CLIENT FILTER */}
              {uniqueClients.length > 0 && (
                <div className={styles.dropdownSection}>
                  <label>Client</label>

                  {uniqueClients.map((c) => (
                    <div
                      key={c}
                      className={`${styles.dropdownItem} ${
                        clientFilter === c ? styles.activeItem : ""
                      }`}
                      title={`Filter by client: ${c}`}
                      onClick={() => setClientFilter(c)}
                    >
                      {c}
                    </div>
                  ))}

                  {clientFilter && (
                    <div
                      className={styles.dropdownClear}
                      title="Clear client filter"
                      onClick={() => setClientFilter("")}
                    >
                      Clear
                    </div>
                  )}
                </div>
              )}

              <div className={styles.divider}></div>

              {/* DUE DATE FILTER */}
              <div className={styles.dropdownSection}>
                <label>Due Date</label>

                <div
                  className={`${styles.dropdownItem} ${
                    dueFilter === "upcoming" ? styles.activeItem : ""
                  }`}
                  title="Show upcoming projects"
                  onClick={() => setDueFilter("upcoming")}
                >
                  Upcoming
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    dueFilter === "overdue" ? styles.activeItem : ""
                  }`}
                  title="Show overdue projects"
                  onClick={() => setDueFilter("overdue")}
                >
                  Overdue
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    dueFilter === "none" ? styles.activeItem : ""
                  }`}
                  title="Show projects without due date"
                  onClick={() => setDueFilter("none")}
                >
                  No Due Date
                </div>

                {dueFilter && (
                  <div
                    className={styles.dropdownClear}
                    title="Clear due-date filter"
                    onClick={() => setDueFilter("")}
                  >
                    Clear
                  </div>
                )}
              </div>

              {(clientFilter || dueFilter || statusFilter) && (
                <button
                  className={styles.clearAllBtn}
                  title="Clear all filters"
                  onClick={() => {
                    setClientFilter("");
                    setDueFilter("");
                    setStatusFilter("");
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {projects.length === 0 && (
        <div className={styles.empty}>No projects.</div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}

          {filtered.length === 0 && projects.length !== 0 && (
            <div className={styles.empty}>No projects match these filters.</div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <KanbanBoard<Project>
          tasks={filtered}
          statusList={STATUS}
          renderCard={(p) => <ProjectCard p={p} />}
          renderOverlayCard={(p) => <ProjectOverlayCard p={p} />}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* MODALS */}
      <NewProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadProjects}
      />

      <DeleteProjectModal
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (id) => {
          await deleteProject(id);
          setDeleteTarget(null);
        }}
      />

      {/* FAB */}
      <button
        className={styles.fab}
        title="Create new project"
        onClick={() => setOpenModal(true)}
      >
        <Plus size={30} />
      </button>
    </div>
  );
}
