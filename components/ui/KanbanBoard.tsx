"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core";

import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import styles from "./kanban.module.scss";
import { useState } from "react";

/* ---------------------------------------------
   GENERIC TYPE SUPPORT
---------------------------------------------- */

export interface KanbanItem {
  id: string;
  status: string;
}

export interface KanbanBoardProps<T extends KanbanItem> {
  tasks: T[];
  statusList: string[];
  renderCard: (task: T) => React.ReactNode;
  renderOverlayCard: (task: T) => React.ReactNode;
  onStatusChange: (id: string, newStatus: T["status"]) => void;
}

/* ---------------------------------------------
   SORTABLE CARD
---------------------------------------------- */

function SortableCard<T extends KanbanItem>({
  task,
  render,
}: {
  task: T;
  render: (task: T) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {render(task)}
    </div>
  );
}

/* ---------------------------------------------
   COLUMN WRAPPER
---------------------------------------------- */

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ""}`}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------
   MAIN KANBAN COMPONENT
---------------------------------------------- */

export default function KanbanBoard<T extends KanbanItem>({
  tasks,
  statusList,
  renderCard,
  renderOverlayCard,
  onStatusChange,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = tasks.find((t) => t.id === activeId) || null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);

    if (!e.over) return;

    const id = String(e.active.id);
    const overId = String(e.over.id);

    // If dropped on a column, move status
    if (statusList.includes(overId)) {
      onStatusChange(id, overId as T["status"]);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.board}>
        {statusList.map((status) => {
          const list = tasks.filter((t) => t.status === status);

          return (
            <DroppableColumn key={status} id={status}>
              <div className={styles.columnHeader}>
                <h4>{status.replace("-", " ").toUpperCase()}</h4>
                <span className={styles.count}>{list.length}</span>
              </div>

              <SortableContext
                items={list.map((t) => t.id)}
                strategy={rectSortingStrategy}
              >
                <div className={styles.list}>
                  {list.map((task) => (
                    <SortableCard
                      key={task.id}
                      task={task}
                      render={renderCard}
                    />
                  ))}

                  {list.length === 0 && (
                    <div className={styles.empty}>No tasks here.</div>
                  )}
                </div>
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? renderOverlayCard(activeTask) : null}
      </DragOverlay>
    </DndContext>
  );
}
