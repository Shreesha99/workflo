"use client";

import { useState } from "react";
import styles from "./DeleteProjectModal.module.scss";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function DeleteProjectModal({
  project,
  onClose,
  onConfirm,
  loading = false,
}: any) {
  if (!project) return null;

  const projectId = typeof project === "string" ? project : project.id;
  const projectName = typeof project === "string" ? project : project.name;

  const [localError, setLocalError] = useState("");

  async function handleDelete() {
    setLocalError("");

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        let msg = json?.error || "Delete failed";

        if (msg.includes("tasks_project_id_fkey")) {
          msg =
            "This project cannot be deleted because tasks are still linked to it. Please delete or reassign those tasks first.";
        } else if (msg.includes("files_project_id_fkey")) {
          msg =
            "This project has files attached to it. Remove all associated files before deleting.";
        } else if (msg.includes("approvals_project_id_fkey")) {
          msg =
            "Approvals are linked to this project. Remove those approvals before deleting.";
        } else if (msg.includes("project_portal_links_project_id_fkey")) {
          msg =
            "A client portal link exists for this project. Delete the portal link first.";
        }

        setLocalError(msg);
        return; // do NOT close modal
      }

      onConfirm(projectId); // notify parent
    } catch (err) {
      setLocalError("Network error while deleting. Try again.");
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Delete Project</h2>

        {/* 🔥 ErrorMessage inside modal */}
        <ErrorMessage message={localError} />

        <p>
          Are you sure you want to delete <strong>{projectName}</strong>? This
          action cannot be undone.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
