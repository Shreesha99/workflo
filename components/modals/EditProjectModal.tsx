"use client";

import { useState } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import styles from "./EditProjectModal.module.scss";

export default function EditProjectModal({ project, onClose, onUpdated }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client_name || "");
  const [email, setEmail] = useState(project.client_email || "");
  const [status, setStatus] = useState(project.status);
  const [dueDate, setDueDate] = useState(project.due_date || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "POST",
      body: JSON.stringify({
        name,
        client,
        email,
        status,
        due_date: dueDate || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to update project");
      return;
    }

    onUpdated(data.project);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Edit Project</h2>

        <ErrorMessage message={error} />

        {/* NAME */}
        <label>Project Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project Name"
        />

        {/* CLIENT NAME */}
        <label>Client Name</label>
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Client Name"
        />

        {/* CLIENT EMAIL */}
        <label>Client Email</label>
        <input
          value={email}
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />

        {/* STATUS */}
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="pending">pending</option>
          <option value="completed">completed</option>
        </select>

        {/* DUE DATE */}
        <label>Due Date</label>
        <input
          type="date"
          value={dueDate || ""}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancel}>
            Cancel
          </button>

          <button onClick={save} className={styles.save} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
