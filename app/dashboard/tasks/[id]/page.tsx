"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

import ErrorMessage from "@/components/ui/ErrorMessage";
import StatusBadge from "@/components/ui/StatusBadge";
import EditTaskModal from "@/components/modals/EditTaskModal";
import DeleteTaskModal from "@/components/modals/DeleteTaskModal";

import { ArrowLeft, Pencil, Trash2, Send } from "lucide-react";

import styles from "./taskdetails.module.scss";

/* ================= TYPES ================= */

type ChatMessage = {
  id: string;
  project_id: string;
  message: string;
  author: string;
  created_at: string;
};

type Note = {
  id: string;
  task_id: string;
  note_text: string;
  created_at: string;
  updated_at: string | null;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in-progress" | "completed";
  created_at: string;
  due_date?: string | null;
  project_id?: string | null;
  projects?: { name: string | null } | null;
};

export default function TaskDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const supabase = supabaseClient();

  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");

  /* ========= NOTES ========= */
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  /* ========= CHAT (PROJECT CHAT) ========= */
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  /* ================= LOAD TASK ================= */
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Failed to load task");
        return;
      }

      setTask(data);
      loadNotes(data.id);
      if (data.project_id) loadChat(data.project_id);
      subscribeToChat(data.project_id);
    }

    if (id) load();
  }, [id]);

  /* ================= NOTES ================= */
  async function loadNotes(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}?notes=true`);
    const json = await res.json();
    if (res.ok) setNotes(json.notes);
  }

  async function updateNote(noteId: string, text: string) {
    setSavingNoteId(noteId);

    setNotes((p) =>
      p.map((n) => (n.id === noteId ? { ...n, note_text: text } : n))
    );

    try {
      await fetch(`/api/tasks/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: text }),
      });
    } catch {
      loadNotes(task!.id);
    }

    setSavingNoteId(null);
  }

  /* ================= CHAT (PROJECT CHAT) ================= */
  async function loadChat(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}?chat=true`);
    const json = await res.json();

    if (res.ok) {
      setChat(json.messages || []);
      idsRef.current.clear();
      json.messages.forEach((m: ChatMessage) => idsRef.current.add(m.id));
    }
  }

  function subscribeToChat(projectId?: string | null) {
    if (!projectId) return;

    const channel = supabase
      .channel("task-project-chat:" + projectId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_chat",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            if (!idsRef.current.has(payload.new.id)) {
              idsRef.current.add(payload.new.id);
              setChat((p) => [...p, payload.new]);
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  async function sendMessage() {
    if (!chatInput.trim() || !task?.project_id) return;

    await fetch(`/api/projects/${task.project_id}?chat=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: chatInput,
        author: "Admin",
      }),
    });

    setChatInput("");
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  if (!task) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={styles.wrapper}>
      {/* LEFT */}
      <div className={styles.left}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/dashboard/tasks")}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className={styles.header}>
          <div className={styles.titleRow}>
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
      </div>

      {/* RIGHT — PROJECT CHAT */}
      <div className={styles.right}>
        <div className={styles.chatSection}>
          <h3>Project Chat</h3>

          <div className={styles.chatMessages}>
            {chat.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${
                  msg.author === "Admin"
                    ? styles.myMessage
                    : styles.theirMessage
                }`}
              >
                <div className={styles.chatBubble}>{msg.message}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR */}
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
          onUpdated={(t) => {
            setTask(t);
            setEditOpen(false);
          }}
        />
      )}

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
