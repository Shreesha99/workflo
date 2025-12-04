"use client";

import { useEffect, useState } from "react";
import styles from "./tasks.module.scss";
import gsap from "gsap";
import { supabaseClient } from "@/lib/supabase/client";

import NewTaskModal from "@/components/modals/NewTaskModal";

export default function TasksPage() {
  const supabase = supabaseClient();

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  // Load tasks
  async function loadTasks() {
    const { data } = await supabase
      .from("tasks")
      .select("*, projects(name)")
      .order("created_at", { ascending: false });

    setTasks(data || []);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  // Animations on change
  useEffect(() => {
    gsap.fromTo(
      ".task-card",
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
        stagger: 0.05,
      }
    );
  }, [tasks]);

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Tasks</h1>

        <div className={styles.right}>
          <button
            className={styles.newTaskBtn}
            onClick={() => setOpenModal(true)}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.map((task) => (
          <div key={task.id} className={`task-card ${styles.card}`}>
            <div className={styles.topRow}>
              <h3>{task.title}</h3>
              <span className={`${styles.status} ${styles[task.status]}`}>
                {task.status}
              </span>
            </div>

            {task.description && (
              <p className={styles.desc}>{task.description}</p>
            )}

            <div className={styles.meta}>
              <span>Project: {task.projects?.name}</span>
              <span>
                Due:{" "}
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <NewTaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={loadTasks}
      />
    </div>
  );
}
