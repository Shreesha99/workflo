"use client";

import { useState, useEffect } from "react";
import styles from "./NoteModal.module.scss";

export default function NoteModal({ projectId, note, onClose, onSaved }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (note) setText(note.note_text);
  }, [note]);

  async function save() {
    if (note) {
      await fetch(`/api/projects/${note.id}`, {
        method: "PUT",
        body: JSON.stringify({ note_text: text }),
      });
    } else {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ note_text: text }),
      });
    }

    onSaved();
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{note ? "Edit Note" : "Add Note"}</h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note..."
        />

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
