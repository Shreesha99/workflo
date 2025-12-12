"use client";

import { useEffect, useState } from "react";
import styles from "./EditTaskModal.module.scss";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import { supabaseClient } from "@/lib/supabase/client";

export default function EditTaskModal({ task, onClose, onUpdated }) {
  const supabase = supabaseClient();

  const [title, setTitle] = useState(task.title || "");
  const [desc, setDesc] = useState(task.description || "");
  const [projectId, setProjectId] = useState(task.project_id || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");
  const [status, setStatus] = useState(task.status);

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load Projects for dropdown
  useEffect(() => {
    async function loadProjects() {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      setProjects(data || []);
    }
    loadProjects();
  }, []);

  async function handleSave() {
    setError("");
    setSuccess("");

    console.log("TASK:", task);
    console.log("TASK ID:", task.id, typeof task.id);

    if (!title.trim()) {
      setError("Task must have a title.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .update({
        title,
        description: desc || null,
        project_id: projectId || null,
        due_date: dueDate || null,
        status,
      })
      .eq("id", task.id)
      .select("*")
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Saved!");
    onUpdated?.(data);

    setTimeout(() => {
      onClose();
    }, 450);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Edit Task</h3>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <label className={styles.label}>Title</label>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className={styles.label}>Description</label>
        <textarea
          className={styles.textarea}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <label className={styles.label}>Project</label>
        <select
          className={styles.select}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">— None —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label className={styles.label}>Due Date</label>
        <input
          className={styles.input}
          type="date"
          value={dueDate || ""}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <label className={styles.label}>Status</label>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
