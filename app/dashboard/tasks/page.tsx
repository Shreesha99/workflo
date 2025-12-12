"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import styles from "./tasks.module.scss";

import NewTaskModal from "@/components/modals/NewTaskModal";
import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";

import { supabaseClient } from "@/lib/supabase/client";
import {
  Filter,
  Search,
  Plus,
  Columns,
  Trash2,
  List as ListIcon,
} from "lucide-react";
import DeleteTaskModal from "@/components/modals/DeleteTaskModal";
import { useRouter } from "next/navigation";

import KanbanBoard from "@/components/ui/KanbanBoard";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in-progress" | "completed";
  due_date?: string | null;
  project_id?: string | null;
  projects?: { name: string | null };
  created_at?: string;
};

export default function TasksPage() {
  const supabase = supabaseClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const [apiError, setApiError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const [projectFilter, setProjectFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");

  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const router = useRouter();

  const uniqueProjects = [
    ...new Set(tasks.map((t) => t.projects?.name).filter(Boolean)),
  ];

  const STATUS: Array<"todo" | "in-progress" | "completed"> = [
    "todo",
    "in-progress",
    "completed",
  ];

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, projects(name)")
      .order("created_at", { ascending: false });

    if (error) return setApiError(error.message);
    setTasks((data as Task[]) || []);
  }

  // GSAP card animation
  useEffect(() => {
    gsap.fromTo(
      ".task-card",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }
    );
  }, [tasks, search, statusFilter, projectFilter, dueFilter, viewMode]);

  // Filters
  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    const matchProject = projectFilter
      ? t.projects?.name === projectFilter
      : true;

    let matchDue = true;
    const today = new Date();

    if (dueFilter === "upcoming")
      matchDue = t.due_date && new Date(t.due_date) > today;
    if (dueFilter === "overdue")
      matchDue = t.due_date && new Date(t.due_date) < today;
    if (dueFilter === "none") matchDue = !t.due_date;

    return matchSearch && matchStatus && matchProject && matchDue;
  });

  // Debounced search
  useEffect(() => {
    const h = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  /* CARD COMPONENT */
  function TaskCard({ t }: { t: Task }) {
    return (
      <div
        className={`task-card ${styles.card}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation?.();
          setDeleteTask(t);
        }}
      >
        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation?.();
            setDeleteTask(t);
          }}
        >
          <Trash2 size={16} />
        </button>

        <div className={styles.cardBody}>
          <h3>{t.title}</h3>

          {t.description && <p className={styles.desc}>{t.description}</p>}

          <div className={styles.metaRow}>
            <StatusBadge status={t.status} />
            <span className={styles.due}>
              {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
            </span>
          </div>

          <div className={styles.projectRow}>
            {t.projects?.name ? "Project: " + t.projects.name : "—"}
          </div>
        </div>
      </div>
    );
  }

  /* DRAG OVERLAY CARD */
  function DragOverlayCard({ t }: { t: Task }) {
    return (
      <div className={`${styles.card} ${styles.dragOverlay}`}>
        <div className={styles.cardBody}>
          <h3>{t.title}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.smallIconBtn} ${
              viewMode === "list" ? styles.smallIconBtnActive : ""
            }`}
            onClick={() => setViewMode("list")}
          >
            <ListIcon size={16} />
          </button>

          <button
            className={`${styles.smallIconBtn} ${
              viewMode === "kanban" ? styles.smallIconBtnActive : ""
            }`}
            onClick={() => setViewMode("kanban")}
          >
            <Columns size={16} />
          </button>
        </div>
      </div>

      <ErrorMessage message={apiError} />

      {/* FILTER UI */}
      <div className={styles.filtersRow}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search tasks..."
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
                {s.replace("-", " ")}
              </div>
            ))}
          </div>
        )}

        {viewMode === "list" && (
          <div className={styles.filterWrap}>
            <button
              className={styles.filterBtn}
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <Filter size={16} /> Filters
            </button>

            {filtersOpen && (
              <div ref={filterRef} className={styles.filterDropdown}>
                <div
                  className={styles.filterCloseBtn}
                  onClick={() => setFiltersOpen(false)}
                >
                  ✕
                </div>

                <div className={styles.dropdownSection}>
                  <label>Project</label>

                  {uniqueProjects.map((p) => (
                    <div
                      key={p}
                      className={`${styles.dropdownItem} ${
                        projectFilter === p ? styles.activeItem : ""
                      }`}
                      onClick={() => setProjectFilter(p)}
                    >
                      {p}
                    </div>
                  ))}

                  <div
                    className={styles.dropdownClear}
                    onClick={() => setProjectFilter("")}
                  >
                    Clear
                  </div>
                </div>

                <div className={styles.divider}></div>

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

                <button
                  className={styles.clearAllBtn}
                  onClick={() => {
                    setProjectFilter("");
                    setDueFilter("");
                    setStatusFilter("");
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className={styles.grid}>
          {filtered.map((t) => (
            <TaskCard key={t.id} t={t} />
          ))}

          {filtered.length === 0 && tasks.length !== 0 && (
            <div className={styles.empty}>No tasks match these filters.</div>
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === "kanban" && (
        <KanbanBoard
          tasks={filtered}
          statusList={STATUS}
          renderCard={(t) => <TaskCard t={t} />}
          renderOverlayCard={(t) => <DragOverlayCard t={t} />}
          onStatusChange={async (id, newStatus: Task["status"]) => {
            const old = tasks;

            setTasks((prev) =>
              prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
            );

            const { error } = await supabase
              .from("tasks")
              .update({ status: newStatus })
              .eq("id", id);

            if (error) setTasks(old);
          }}
        />
      )}

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => setOpenModal(true)}
        aria-label="New task"
      >
        <Plus size={30} />
      </button>

      <NewTaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadTasks}
      />

      {deleteTask && (
        <DeleteTaskModal
          task={deleteTask}
          onClose={() => setDeleteTask(null)}
          onConfirm={async () => {
            await supabase.from("tasks").delete().eq("id", deleteTask.id);
            setDeleteTask(null);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}
