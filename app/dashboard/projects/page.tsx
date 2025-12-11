"use client";

import React, { useEffect, useState } from "react";
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

// DnD Kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Project = {
  id: string;
  name: string;
  client_name?: string | null;
  status?: "active" | "pending" | "completed" | string | null;
  created_at?: string;
  due_date?: string | null;
  order_index?: number | null;
  [k: string]: any;
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

  // dnd-kit dragging state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayProject, setOverlayProject] = useState<Project | null>(null);
  const filterRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }

    if (filtersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filtersOpen]);

  const STATUS: Array<"active" | "pending" | "completed"> = [
    "active",
    "pending",
    "completed",
  ];

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
    const json = await res.json().catch(() => ({}));

    if (!res.ok) return setApiError(json?.error || "Failed to delete project");

    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
  }

  useEffect(() => {
    gsap.fromTo(
      ".project-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }
    );
  }, [projects, search, statusFilter, clientFilter, dueFilter, viewMode]);

  const uniqueClients = [
    ...new Set(projects.map((p) => p.client_name).filter(Boolean)),
  ];

  const today = new Date();

  const filtered = projects.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
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

  /* ----------------------
     DnD Kit config
     ---------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // helper to check if string is valid status
  function isStatus(
    x: string | null | undefined
  ): x is "active" | "pending" | "completed" {
    return !!x && (STATUS as string[]).includes(x);
  }

  // build map: status -> ordered list of project ids
  function columnsToIds(sourceProjects = projects) {
    const map: Record<string, string[]> = {};
    for (const s of STATUS) map[s] = [];

    for (const p of sourceProjects) {
      const status = (p.status as string) || "pending";
      if (!map[status]) map[status] = [];
      map[status].push(p.id);
    }

    return map;
  }

  // used when rendering kanban (we respect filtered results when filters are active)
  const columns = columnsToIds(filtered.length ? filtered : projects);

  function findProjectById(id: string) {
    return projects.find((p) => p.id === id) || null;
  }

  function rebuildProjectsFromColumns(newColumns: Record<string, string[]>) {
    const idToProject: Record<string, Project> = {};
    for (const p of projects) idToProject[p.id] = p;

    const newList: Project[] = [];
    for (const s of STATUS) {
      const ids = newColumns[s] || [];
      for (const id of ids) {
        const proj = idToProject[id];
        if (proj) newList.push({ ...proj, status: s });
      }
    }

    // append any missing projects (safe guard)
    const included = new Set(newList.map((p) => p.id));
    for (const p of projects) if (!included.has(p.id)) newList.push(p);

    return newList;
  }

  // Droppable column wrapper
  function DroppableColumn({
    columnId,
    children,
  }: {
    columnId: "active" | "pending" | "completed";
    children: React.ReactNode;
  }) {
    const { setNodeRef, isOver } = useDroppable({ id: columnId });

    return (
      <div
        ref={setNodeRef}
        className={`${styles.kanbanColumn} ${
          isOver ? styles.kanbanColumnDragOver : ""
        }`}
      >
        {children}
      </div>
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return setOverlayProject(null);

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // map of source columns (from full projects list)
    const sourceColumns = columnsToIds(projects);
    let destColumns = { ...sourceColumns };

    const sourceColumnKey =
      STATUS.find((s) => sourceColumns[s].includes(activeIdStr)) || null;

    // determine destination column key
    let destColumnKey: "active" | "pending" | "completed" | null = null;
    // if over is a card id, find which column contains that card
    const overCardColumn = STATUS.find((s) =>
      sourceColumns[s].includes(overIdStr)
    );
    if (overCardColumn) destColumnKey = overCardColumn;
    // if over is the column id itself (we chose Option A), treat as dropping into that column
    else if (isStatus(overIdStr)) destColumnKey = overIdStr;

    if (!destColumnKey) {
      setOverlayProject(null);
      return;
    }

    // lists representing ids in source and dest columns
    const fromList = Array.from(
      sourceColumns[sourceColumnKey || "pending"] || []
    );
    const toList = Array.from(sourceColumns[destColumnKey] || []);

    const fromIndex = fromList.indexOf(activeIdStr);

    // compute insertion index in destination
    let insertionIndex = toList.length; // default -> end of column

    // if over is a card id and it belongs to destination column, insert before that card
    if (sourceColumns[destColumnKey].includes(overIdStr)) {
      const overIndex = toList.indexOf(overIdStr);
      if (overIndex !== -1) {
        insertionIndex = overIndex;
      }
    } else if (isStatus(overIdStr)) {
      // over is column id -> Option 2 behavior: determine whether cursor was above/below last card
      // In this simplified approach we insert at end (common Trello behavior). If you'd like
      // a pixel-precise top/bottom detection, we can add measuring on pointer position.
      insertionIndex = toList.length;
    }

    // If moving inside same column, handle reorder
    if (sourceColumnKey === destColumnKey) {
      // only proceed if indices differ
      if (fromIndex === -1) {
        setOverlayProject(null);
        return;
      }
      // if insertionIndex refers to same position or adjacent no-op, still compute new array
      const newList = Array.from(toList);
      // remove the active id from its old spot (source and dest are same)
      newList.splice(fromIndex, 1);
      // if the active was before the insertion point originally and we're inserting after its old spot,
      // adjust insertionIndex because removal shifts indices.
      let adjustedIndex = insertionIndex;
      if (fromIndex < insertionIndex) adjustedIndex = insertionIndex - 1;
      newList.splice(adjustedIndex, 0, activeIdStr);

      destColumns = { ...sourceColumns, [destColumnKey]: newList };
    } else {
      // moving across columns
      const newFrom = Array.from(fromList);
      if (fromIndex !== -1) newFrom.splice(fromIndex, 1);

      const newTo = Array.from(toList);
      // insertionIndex may be toList.length (append) or index of over card
      newTo.splice(insertionIndex, 0, activeIdStr);

      destColumns = {
        ...sourceColumns,
        [sourceColumnKey || "pending"]: newFrom,
        [destColumnKey]: newTo,
      };
    }

    const newProjectsList = rebuildProjectsFromColumns(destColumns);

    // optimistic update
    const prev = projects;
    setProjects(newProjectsList);

    // persist only the moved project's new status (and order_index if desired)
    const moved = findProjectById(activeIdStr);
    if (!moved) {
      setOverlayProject(null);
      return;
    }

    const newIndex = newProjectsList.findIndex((p) => p.id === moved.id);
    const newStatus = newProjectsList[newIndex].status;

    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", moved.id)
        .select("*")
        .single();

      if (error) throw error;

      // replace moved item with server canonical data
      setProjects((prevList) =>
        prevList.map((p) => (p.id === moved.id ? (data as Project) : p))
      );
    } catch (err: any) {
      console.error("Failed to persist project move:", err);
      setApiError("Failed to move project. Reverting.");
      setProjects(prev);
    } finally {
      setOverlayProject(null);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    const proj = findProjectById(active.id as string);
    setOverlayProject(proj);
  }

  /* Helper: render project card (shared between list/grid and kanban) */
  function ProjectCard({ p }: { p: Project }) {
    return (
      <div
        key={p.id}
        className={`project-card ${styles.card} ${
          activeId === p.id ? styles.dragging : ""
        }`}
      >
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
    );
  }

  /* Kanban rendering using dnd-kit */
  function KanbanBoard() {
    const colIds = STATUS;

    const filteredIds = new Set(filtered.map((p) => p.id));

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      >
        <div className={styles.kanbanBoard}>
          {colIds.map((s) => {
            const allIds = columnsToIds(projects)[s] || [];
            const colProjectIds = allIds.filter((id) => filteredIds.has(id));

            return (
              <DroppableColumn key={s} columnId={s}>
                <div className={styles.kanbanHeader}>
                  <h4>{s.toUpperCase()}</h4>
                  <span className={styles.kanbanCount}>
                    {colProjectIds.length}
                  </span>
                </div>

                <SortableContext
                  items={colProjectIds}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className={styles.kanbanList}
                    id={s}
                    data-droppable-id={s}
                  >
                    {colProjectIds.map((id) => {
                      const p = projects.find((x) => x.id === id)!;
                      return <SortableProjectCard key={p.id} p={p} />;
                    })}

                    {colProjectIds.length === 0 && (
                      <div className={styles.kanbanEmpty}>
                        No projects in this column.
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {overlayProject ? <DragOverlayCard p={overlayProject} /> : null}
        </DragOverlay>
      </DndContext>
    );
  }

  /* Sortable project card using dnd-kit useSortable */
  function SortableProjectCard({ p }: { p: Project }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: p.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform as any),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={styles.kanbanCardWrapper}
        {...attributes}
        {...listeners}
      >
        <ProjectCard p={p} />
      </div>
    );
  }

  function DragOverlayCard({ p }: { p: Project }) {
    return (
      <div className={`${styles.card} ${styles.dragOverlay}`}>
        <div className={styles.cardBody}>
          <h3>{p.name}</h3>
          <p className={styles.clientRow}>Client: {p.client_name || "—"}</p>
        </div>
      </div>
    );
  }

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Projects</h1>

        {/* top-right controls: view toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.smallIconBtn} ${
              viewMode === "list" ? styles.smallIconBtnActive : ""
            }`}
            title="List view"
            onClick={() => setViewMode("list")}
          >
            <ListIcon size={16} />
          </button>

          <button
            className={`${styles.smallIconBtn} ${
              viewMode === "kanban" ? styles.smallIconBtnActive : ""
            }`}
            title="Kanban view"
            onClick={() => setViewMode("kanban")}
          >
            <Columns size={16} />
          </button>
        </div>
      </div>

      <ErrorMessage message={apiError || ""} />

      {/* 🔥 UNIFIED CONTROL BAR */}
      <div className={styles.filtersRow}>
        {/* Search */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search size={16} className={styles.searchIcon} />
        </div>

        {/* Hide pills when in kanban mode */}
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

        {/* Unified Filter Button */}
        <div className={styles.filterWrap}>
          <button
            className={styles.filterBtn}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <Filter size={16} /> Filters
          </button>

          {filtersOpen && (
            <div ref={filterRef} className={styles.filterDropdown}>
              {/* Close button inside dropdown */}
              <div
                className={styles.filterCloseBtn}
                onClick={() => setFiltersOpen(false)}
              >
                ✕
              </div>

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

      {projects.length === 0 && (
        <div className={styles.empty}>No projects created.</div>
      )}

      {/* MAIN CONTENT: list or kanban */}
      {viewMode === "list" ? (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}

          {filtered.length === 0 && projects.length !== 0 && (
            <div className={styles.empty}>No projects match these filters.</div>
          )}
        </div>
      ) : (
        <KanbanBoard />
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

      <button
        className={styles.fab}
        onClick={() => setOpenModal(true)}
        aria-label="New project"
      >
        <Plus size={30} />
      </button>
    </div>
  );
}
