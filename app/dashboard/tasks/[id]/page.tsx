"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";
import EditTaskModal from "@/components/modals/EditTaskModal";
import DeleteTaskModal from "@/components/modals/DeleteTaskModal";

import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";

import styles from "./taskdetails.module.scss";

type Note = {
  id: string;
  task_id: string;
  note_text: string;
  created_at: string;
  updated_at?: string | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in-progress" | "completed";
  due_date?: string | null;
  created_at: string;
  project_id?: string | null;
  projects?: { name: string | null } | null;
};

export default function TaskDetailsPage() {
  const { id } = useParams() as { id: string };
  const supabase = supabaseClient();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Load task
  useEffect(() => {
    if (!id) return;

    async function load() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return setError("Failed to load task");

      setTask(data);
      loadNotes();
    }

    load();
  }, [id]);

  // Load Notes
  async function loadNotes() {
    setNotesLoading(true);

    try {
      const res = await fetch(`/api/tasks/${id}?notes=true`);
      const json = await res.json();

      if (!res.ok) throw new Error();

      setNotes(json.notes);
    } catch {}

    setNotesLoading(false);
  }

  async function createNote() {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: "" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error();

      const note = json.note as Note;
      setNotes((prev) => [note, ...prev]);
      setEditingId(note.id);
    } catch {}
  }

  async function updateNote(noteId: string, newText: string) {
    setSavingNoteId(noteId);

    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, note_text: newText } : n))
    );

    try {
      await fetch(`/api/tasks/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: newText }),
      });
    } catch {
      loadNotes();
    }

    setSavingNoteId(null);
  }

  async function deleteNote(noteId: string) {
    const backup = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      await fetch(`/api/tasks/${id}?note=${noteId}`, { method: "DELETE" });
    } catch {
      setNotes(backup);
    }
  }

  if (!task) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.container}>
      <ErrorMessage message={error} />

      <button
        className={styles.backBtn}
        onClick={() => router.push("/dashboard/tasks")}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className={styles.header}>
        <div>
          <h1>{task.title}</h1>
          <StatusBadge status={task.status} />
        </div>
      </div>

      <div className={styles.infoCard}>
        <p>
          <strong>Description:</strong> {task.description || "—"}
        </p>
        <p>
          <strong>Project:</strong> {task.projects?.name || "—"}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {new Date(task.created_at).toLocaleDateString()}
        </p>
        <p>
          <strong>Due:</strong>{" "}
          {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
        </p>
      </div>

      {/* ACTION BAR */}
      <div className={styles.actionBarFloating}>
        <button className={styles.actionBtn} onClick={() => setEditOpen(true)}>
          <Pencil size={16} /> Edit
        </button>

        <button
          className={styles.actionBtnDanger}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {editOpen && (
        <EditTaskModal
          task={task}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => {
            setTask(updated);
            setEditOpen(false);
          }}
        />
      )}

      {/* FIXED DELETE MODAL */}
      {deleteOpen && (
        <DeleteTaskModal
          task={task}
          onClose={() => setDeleteOpen(false)}
          onConfirm={async () => {
            await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
            router.push("/dashboard/tasks");
          }}
        />
      )}
    </div>
  );
}
