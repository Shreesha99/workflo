"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { supabaseClient } from "@/lib/supabase/client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import styles from "./NewTaskModal.module.scss";

export default function NewTaskModal({ open, onClose, onCreated }) {
  const supabase = supabaseClient();
  const modalRef = useRef(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("todo");

  const [projects, setProjects] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Load project options
  useEffect(() => {
    async function loadProjects() {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("created_at");

      setProjects(data || []);
    }

    if (open) loadProjects();
  }, [open]);

  // Animate Modal
  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.32, ease: "power2.out" }
      );
    }
  }, [open]);

  async function handleCreate() {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Task must have a title.");
      return;
    }

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    setLoading(true);

    const { data: userObj } = await supabase.auth.getUser();

    const { error } = await supabase.from("tasks").insert({
      title,
      description: desc || null,
      project_id: projectId,
      due_date: dueDate || null,
      status,
      created_by: userObj.user.id,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Task created!");

    onCreated?.();

    setTimeout(() => {
      onClose();
      setTitle("");
      setDesc("");
      setProjectId("");
      setDueDate("");
      setSuccess("");
    }, 700);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>New Task</h2>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={undefined}
        />

        <Input
          label="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={undefined}
        />

        <label className={styles.label}>Project</label>
        <select
          className={styles.select}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <Input
          type="date"
          label="Due Date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder={undefined}
        />

        <label className={styles.label}>Status</label>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <Button
          loading={loading}
          onClick={handleCreate}
          className={styles.createBtn}
        >
          Create Task
        </Button>
      </div>
    </div>
  );
}
