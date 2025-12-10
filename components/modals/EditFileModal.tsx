"use client";

import { useEffect, useState } from "react";
import styles from "./EditFileModal.module.scss";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import { supabaseClient } from "@/lib/supabase/client";

export default function EditFileModal({ file, onClose, onSaved }: any) {
  const supabase = supabaseClient();

  // Detect extension safely
  const originalName = file.display_name ?? file.path ?? "";
  const lastDot = originalName.lastIndexOf(".");
  const base = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;
  const ext = lastDot !== -1 ? originalName.slice(lastDot) : ""; // includes the dot e.g. ".png"

  const [name, setName] = useState(base);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const orig = file.display_name ?? file.path ?? "";
    const dot = orig.lastIndexOf(".");
    setName(dot !== -1 ? orig.slice(0, dot) : orig);
  }, [file]);

  async function save() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    const finalName = `${name.trim()}${ext}`;

    setLoading(true);

    const { error: updateError } = await supabase
      .from("files")
      .update({ display_name: finalName })
      .eq("id", file.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Saved!");
    onSaved();

    setTimeout(() => {
      onClose();
    }, 450);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Edit File</h3>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        {/* FILENAME INPUT WITH LOCKED EXTENSION */}
        <div className={styles.filenameRow}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter file name"
            className={styles.nameInput}
          />
          <span className={styles.ext}>{ext}</span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button className={styles.saveBtn} onClick={save} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
