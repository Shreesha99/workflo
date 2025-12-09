"use client";

import { useState } from "react";
import styles from "./EditFileModal.module.scss";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import { supabaseClient } from "@/lib/supabase/client";

export default function EditFileModal({ file, onClose, onSaved }) {
  const supabase = supabaseClient();

  const [name, setName] = useState(file.display_name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase
      .from("files")
      .update({ display_name: name.trim() })
      .eq("id", file.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("File updated!");
    setTimeout(() => {
      onSaved();
    }, 500);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Edit File</h3>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter file name"
        />

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.saveBtn} onClick={save} disabled={loading}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
