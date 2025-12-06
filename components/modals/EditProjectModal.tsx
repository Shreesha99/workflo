"use client";

import { useState } from "react";
import styles from "./EditProjectModal.module.scss";

export default function EditProjectModal({ project, onClose, onUpdated }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client_name || "");
  const [email, setEmail] = useState(project.client_email || "");
  const [status, setStatus] = useState(project.status);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "POST",
      body: JSON.stringify({ name, client, email, status }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert("Error updating project");
      return;
    }

    onUpdated(data.project);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Edit Project</h2>

        <label>Project Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Client Name</label>
        <input value={client} onChange={(e) => setClient(e.target.value)} />

        <label>Client Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Active</option>
          <option>Pending</option>
          <option>Completed</option>
        </select>

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
