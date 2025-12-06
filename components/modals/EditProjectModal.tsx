"use client";

import { useState } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Calendar from "@/components/ui/Calendar";
import styles from "./EditProjectModal.module.scss";

export default function EditProjectModal({ project, onClose, onUpdated }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client_name || "");
  const [email, setEmail] = useState(project.client_email || "");
  const [status, setStatus] = useState(project.status);
  const [dueDate, setDueDate] = useState(project.due_date || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCal, setShowCal] = useState(false);

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

        <label>Project Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Client Name</label>
        <input value={client} onChange={(e) => setClient(e.target.value)} />

        <label>Client Email</label>
        <input
          value={email}
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">active</option>
          <option value="pending">pending</option>
          <option value="completed">completed</option>
        </select>

        {/* DATE */}
        <div className={styles.datePickerWrap}>
          <label>Due Date</label>

          <div
            className={styles.dateInput}
            onClick={() => setShowCal(!showCal)}
          >
            {dueDate || "Select a date"}
          </div>

          {showCal && (
            <Calendar
              value={dueDate}
              onChange={(d) => setDueDate(d)}
              onClose={() => setShowCal(false)}
              showWarningCheck={true}
            />
          )}
        </div>

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
