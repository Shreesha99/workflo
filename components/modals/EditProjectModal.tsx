"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./EditProjectModal.module.scss";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Calendar from "@/components/ui/Calendar";
import { X } from "lucide-react";

export default function EditProjectModal({ project, onClose, onUpdated }) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client_name || "");
  const [email, setEmail] = useState(project.client_email || "");
  const [status, setStatus] = useState(project.status);
  const [dueDate, setDueDate] = useState(project.due_date || "");

  const [showCal, setShowCal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!modalRef.current) return;
    modalRef.current.style.opacity = "0";
    modalRef.current.style.transform = "scale(0.92)";

    requestAnimationFrame(() => {
      modalRef.current!.style.opacity = "1";
      modalRef.current!.style.transform = "scale(1)";
    });
  }, []);

  async function save() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        client_name: client,
        client_email: email,
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
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className={styles.modalHeader}>
          <h2>Edit Project</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <ErrorMessage message={error} />

        {/* NAME */}
        <div className={styles.field}>
          <label>Project Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* CLIENT */}
        <div className={styles.field}>
          <label>Client Name</label>
          <input
            className={styles.input}
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </div>

        {/* EMAIL */}
        <div className={styles.field}>
          <label>Client Email</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* STATUS */}
        <div className={styles.field}>
          <label>Status</label>

          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* DUE DATE */}
        <div className={styles.field}>
          <label>Due Date</label>

          <div
            className={styles.dateInput}
            onClick={() => setShowCal(!showCal)}
          >
            {dueDate ? new Date(dueDate).toLocaleDateString() : "Select a date"}
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

        {/* BUTTONS */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.saveBtn} onClick={save} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
