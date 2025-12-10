"use client";

import styles from "./DeleteFileModal.module.scss";
import { Trash2 } from "lucide-react";

export default function DeleteFileModal({
  file,
  onClose,
  onConfirm,
}: {
  file: any;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <Trash2 size={38} />
        </div>

        <h2>Delete File?</h2>

        <p className={styles.text}>
          Are you sure you want to permanently delete{" "}
          <strong>{file.display_name ?? file.path}</strong>?
        </p>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.deleteBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
