"use client";

import { useEffect, useState } from "react";
import styles from "./DeleteProjectModal.module.scss";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { supabaseClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function DeleteProjectModal({
  project,
  onClose,
  onConfirm,
}: any) {
  const isOpen = !!project;

  const projectId = typeof project === "string" ? project : project?.id;

  const [localError, setLocalError] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project) return;

    async function load() {
      if (typeof project === "string") {
        const { data } = await supabaseClient()
          .from("projects")
          .select("name")
          .eq("id", project)
          .single();

        setProjectName(data?.name || "this project");
      } else {
        setProjectName(project.name);
      }
    }

    load();
  }, [project]);

  async function handleDelete() {
    setLocalError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        let msg = json?.error || "Delete failed";
        setLocalError(msg);
        setLoading(false);
        return;
      }

      await onConfirm(projectId);
      setLoading(false);
    } catch (err) {
      setLocalError("Network error while deleting. Try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      style={{ display: isOpen ? "flex" : "none" }}
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Delete Project</h2>

        <ErrorMessage message={localError} />

        <p>
          Are you sure you want to delete <strong>{projectName}</strong>? This
          action cannot be undone.
        </p>

        <div className={styles.actions}>
          <Button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            className={styles.deleteBtn}
            loading={loading}
            onClick={handleDelete}
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
