"use client";
import styles from "./DeleteProjectModal.module.scss";

export default function DeleteProjectModal({ project, onClose, onConfirm }) {
  if (!project) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Delete Project</h2>
        <p>
          Are you sure you want to delete this project?
          <br />
          This action cannot be undone.
        </p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button
            className={styles.deleteBtn}
            onClick={() => onConfirm(project)}
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
