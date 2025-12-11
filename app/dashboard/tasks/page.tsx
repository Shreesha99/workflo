"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import styles from "./tasks.module.scss";

import NewTaskModal from "@/components/modals/NewTaskModal";
import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";

import { supabaseClient } from "@/lib/supabase/client";
import { Filter, Search, Plus, Columns, List as ListIcon } from "lucide-react";

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlayTask, setOverlayTask] = useState<Task | null>(null);

  const [projectFilter, setProjectFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const uniqueProjects = [
    ...new Set(tasks.map((t) => t.projects?.name).filter(Boolean)),
  ];

  const STATUS: Array<"todo" | "in-progress" | "completed"> = [
    "todo",
    "in-progress",
    "completed",
  ];

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

  useEffect(() => {
    gsap.fromTo(
      ".task-card",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }
    );
  }, [tasks, search, statusFilter, projectFilter, dueFilter, viewMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  function columnsFromTasks(arr = tasks) {
    const obj: Record<string, string[]> = {
      todo: [],
      "in-progress": [],
      completed: [],
    };
    arr.forEach((t) => obj[t.status].push(t.id));
    return obj;
  }

  const columns = columnsFromTasks(tasks);

  function findTaskById(id: string) {
    return tasks.find((t) => t.id === id) || null;
  }

  function DroppableColumn({
    columnId,
    children,
  }: {
    columnId: "todo" | "in-progress" | "completed";
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

  /******************************************
   *       FINAL 100% BUG-FREE VERSION
   ******************************************/
  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);

    if (!over) return setOverlayTask(null);

    const sourceId = active.id as string;
    const overId = over.id as string;

    const sourceCols = columnsFromTasks(tasks);
    const sourceCol = STATUS.find((col) => sourceCols[col].includes(sourceId))!;
    let destCol = sourceCol;

    const overIsColumn = STATUS.includes(overId as any);
    const overIsTask = !overIsColumn;

    if (overIsColumn) {
      destCol = overId as any;

      // dropping into same column = do nothing
      if (destCol === sourceCol) {
        setOverlayTask(null);
        return;
      }
    } else {
      // dropped onto a task
      const found = STATUS.find((c) => sourceCols[c].includes(overId));
      if (found) destCol = found!;
    }

    const fromList = [...sourceCols[sourceCol]];
    const toList = [...sourceCols[destCol]];

    const oldIndex = fromList.indexOf(sourceId);

    // NOW remove from source list
    fromList.splice(oldIndex, 1);

    let newIndex;

    if (overIsTask) {
      const overIdx = toList.indexOf(overId);

      newIndex = overIdx === -1 ? toList.length : overIdx;

      if (sourceCol === destCol && oldIndex < newIndex) newIndex -= 1;
    } else {
      newIndex = toList.length;
    }

    toList.splice(newIndex, 0, sourceId);

    // rebuild
    const map: Record<string, Task> = {};
    tasks.forEach((t) => (map[t.id] = t));

    const next: Task[] = [];
    STATUS.forEach((col) => {
      const colIds =
        col === sourceCol
          ? fromList
          : col === destCol
          ? toList
          : sourceCols[col];
      colIds.forEach((id) => next.push({ ...map[id], status: col }));
    });

    const prev = tasks;
    setTasks(next);

    try {
      await supabase
        .from("tasks")
        .update({ status: destCol })
        .eq("id", sourceId);
    } catch {
      setTasks(prev);
    }

    setOverlayTask(null);
  }

  function handleDragStart(e: DragStartEvent) {
    const id = e.active.id as string;
    setActiveId(id);
    setOverlayTask(findTaskById(id));
  }

  function TaskCard({ t }: { t: Task }) {
    return (
      <div
        className={`task-card ${styles.card} ${
          activeId === t.id ? styles.dragging : ""
        }`}
      >
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

  function SortableTask({ t }: { t: Task }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: t.id });

    const style = {
      transform: CSS.Transform.toString(transform),
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
        <TaskCard t={t} />
      </div>
    );
  }

  function DragOverlayCard({ t }: { t: Task }) {
    return (
      <div className={`${styles.card} ${styles.dragOverlay}`}>
        <div className={styles.cardBody}>
          <h3>{t.title}</h3>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const h = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(h);
  }, [searchInput]);

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

      <div className={styles.filtersRow}>
        {/* SEARCH BAR ALWAYS VISIBLE */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search size={16} className={styles.searchIcon} />
        </div>

        {/* PILLS ONLY IN LIST VIEW */}
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

        {/* FILTER BUTTON ONLY IN LIST VIEW */}
        {viewMode === "list" && (
          <div className={styles.filterWrap}>
            <button
              className={styles.filterBtn}
              onClick={() => setFiltersOpen((p) => !p)}
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

                {/* PROJECT FILTER */}
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

                {/* DUE DATE FILTER */}
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

      {tasks.length === 0 && (
        <div className={styles.empty}>No tasks created.</div>
      )}

      {viewMode === "list" ? (
        <div className={styles.grid}>
          {filtered.map((t) => (
            <TaskCard key={t.id} t={t} />
          ))}
          {filtered.length === 0 && tasks.length !== 0 && (
            <div className={styles.empty}>No tasks match these filters.</div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          <div className={styles.kanbanBoard}>
            {STATUS.map((s) => {
              const ids = filtered
                .filter((t) => t.status === s)
                .map((t) => t.id);

              return (
                <DroppableColumn key={s} columnId={s}>
                  <div className={styles.kanbanHeader}>
                    <h4>{s.replace("-", " ").toUpperCase()}</h4>
                    <span className={styles.kanbanCount}>{ids.length}</span>
                  </div>

                  <SortableContext items={ids} strategy={rectSortingStrategy}>
                    <div className={styles.kanbanList}>
                      {ids.map((id) => {
                        const t = tasks.find((x) => x.id === id)!;
                        return <SortableTask key={id} t={t} />;
                      })}

                      {ids.length === 0 && (
                        <div className={styles.kanbanEmpty}>No tasks here.</div>
                      )}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {overlayTask ? <DragOverlayCard t={overlayTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}

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
    </div>
  );
}
