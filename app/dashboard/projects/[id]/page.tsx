"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

import ErrorMessage from "@/components/ui/ErrorMessage";
import EditProjectModal from "@/components/modals/EditProjectModal";
import StatusBadge from "@/components/ui/StatusBadge";
import DeleteProjectModal from "@/components/modals/DeleteProjectModal";

import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  Link2,
  Check,
  XCircle,
  Plus,
} from "lucide-react";

import styles from "./projectdetails.module.scss";

/* CHAT */
type ChatMessage = {
  id: string;
  project_id: string;
  message: string;
  author: string;
  created_at: string;
};

/* -------------------------------------------------------------
   CORRECT NOTE TYPE (DB = note_text)
------------------------------------------------------------- */
type Note = {
  id: string;
  project_id: string;
  note_text: string;
  created_at: string;
  updated_at: string | null;
};

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const supabase = supabaseClient();

  const [project, setProject] = useState<any>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  /* Notes */
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatInput, setChatInput] = useState("");

  async function loadChat() {
    setChatLoading(true);
    setChatError("");

    try {
      const res = await fetch(`/api/projects/${id}?chat=true`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load chat");

      setChat(json.messages);
    } catch (err) {
      console.error("[CLIENT] loadChat error:", err);
      setChatError("Failed to load chat.");
    } finally {
      setChatLoading(false);
    }
  }

  async function sendMessage() {
    if (!chatInput.trim()) return;

    try {
      const res = await fetch(`/api/projects/${id}?chat=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput,
          author: "Admin",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setChat((prev) => [...prev, json.message]);
      setChatInput("");
    } catch (err) {
      console.error("[CLIENT] sendMessage error:", err);
      setChatError("Failed to send.");
    }
  }

  /* -------------------------------------------------------------
     Load project + portal + notes
  ------------------------------------------------------------- */
  async function loadPortalLink() {
    const { data } = await supabase
      .from("project_portal_links")
      .select("token")
      .eq("project_id", id)
      .maybeSingle();

    if (data?.token) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      setPortalUrl(`${base}/portal/${data.token}`);
    }
  }

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError("Failed to load project.");
        return;
      }

      setProject(data);
      loadPortalLink();
      loadNotes();
    }

    if (id) load();
  }, [id]);

  /* -------------------------------------------------------------
     NOTES: Load from backend API
  ------------------------------------------------------------- */
  async function loadNotes() {
    setNotesLoading(true);
    setNotesError("");

    try {
      const res = await fetch(`/api/projects/${id}?notes=true`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load notes");

      setNotes(json.notes);
    } catch (err: any) {
      console.error("[CLIENT] loadNotes error:", err);
      setNotesError("Failed to load notes.");
    } finally {
      setNotesLoading(false);
    }
  }

  /* -------------------------------------------------------------
     Create Note (PATCH)
  ------------------------------------------------------------- */
  async function createNote() {
    setNotesError("");

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: "" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const note = json.note as Note;
      setNotes((prev) => [note, ...prev]);
      setEditingId(note.id);
    } catch (err) {
      console.error("[CLIENT] createNote error:", err);
      setNotesError("Failed to create note.");
    }
  }

  /* -------------------------------------------------------------
     Update Note (PUT)
  ------------------------------------------------------------- */
  async function updateNote(noteId: string, newText: string) {
    try {
      // optimistic update
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, note_text: newText } : n))
      );

      const res = await fetch(`/api/projects/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: newText }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
    } catch (err) {
      console.error("[CLIENT] updateNote error:", err);
      setNotesError("Failed to save note.");
      loadNotes(); // reload original
    }
  }

  /* -------------------------------------------------------------
     Delete Note (DELETE)
  ------------------------------------------------------------- */
  async function deleteNote(noteId: string) {
    const backup = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      const res = await fetch(`/api/projects/${noteId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
    } catch (err) {
      console.error("[CLIENT] deleteNote error:", err);
      setNotesError("Failed to delete note.");
      setNotes(backup);
    }
  }

  /* Focus textarea automatically */
  useEffect(() => {
    if (editingId && editingRef.current) {
      const el = editingRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editingId]);

  /* -------------------------------------------------------------
     Portal Actions
  ------------------------------------------------------------- */
  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}`);
    const json = await res.json();
    if (!res.ok) return setError("Failed to generate portal link.");
    setPortalUrl(json.url);
  }

  async function removePortalLink() {
    await supabase.from("project_portal_links").delete().eq("project_id", id);
    setPortalUrl("");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!project) return <p className={styles.loading}>Loading…</p>;

  /* -------------------------------------------------------------
     UI
  ------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      <ErrorMessage message={error} />

      {/* Back */}
      <button
        className={styles.backBtn}
        onClick={() => router.push("/dashboard/projects")}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Info */}
      <div className={styles.infoCard}>
        <p>
          <strong>Client:</strong> {project.client_name || "—"}
        </p>
        <p>
          <strong>Email:</strong> {project.client_email || "—"}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {new Date(project.created_at).toLocaleDateString()}
        </p>
        <p>
          <strong>Due Date:</strong>{" "}
          {project.due_date
            ? new Date(project.due_date).toLocaleDateString()
            : "—"}
        </p>
      </div>

      {/* -------------------------------------------------------------
         NOTES (Notion style)
      ------------------------------------------------------------- */}
      <div className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <h2>Project Notes</h2>
          <button className={styles.addNoteBtn} onClick={createNote}>
            <Plus size={14} /> Add Note
          </button>
        </div>

        <ErrorMessage message={notesError} />

        <div className={styles.notesGrid}>
          {notesLoading && <div className={styles.notesEmpty}>Loading…</div>}
          {!notesLoading && notes.length === 0 && (
            <div className={styles.notesEmpty}>No notes yet. Add one.</div>
          )}

          {notes.map((note) => (
            <div key={note.id} className={styles.noteCard}>
              <div className={styles.noteControls}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setEditingId(note.id)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={styles.iconBtnDanger}
                  onClick={() => deleteNote(note.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className={styles.noteBody}>
                {editingId === note.id ? (
                  <textarea
                    ref={editingRef}
                    defaultValue={note.note_text}
                    className={styles.noteTextarea}
                    onBlur={(e) => {
                      setEditingId(null);
                      updateNote(note.id, e.target.value.trim());
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        setEditingId(null);
                        updateNote(
                          note.id,
                          (e.target as HTMLTextAreaElement).value.trim()
                        );
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                        loadNotes();
                      }
                    }}
                    placeholder="Write a note…"
                  />
                ) : (
                  <div
                    className={styles.noteContent}
                    onClick={() => setEditingId(note.id)}
                  >
                    {note.note_text ? (
                      note.note_text
                        .split("\n")
                        .map((line, i) => <p key={i}>{line}</p>)
                    ) : (
                      <p className={styles.notePlaceholder}>Click to edit…</p>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.noteFooter}>
                <span>
                  {new Date(note.created_at).toLocaleString()}
                  {note.updated_at ? " • updated" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* -------------------------------------------------------------
   CHAT SECTION
------------------------------------------------------------- */}
      <div className={styles.chatSection}>
        <div className={styles.chatHeader}>
          <h2>Project Chat</h2>
        </div>

        {chatLoading && <div className={styles.chatEmpty}>Loading chat…</div>}
        {chatError && <ErrorMessage message={chatError} />}
        {!chatLoading && chat.length === 0 && (
          <div className={styles.chatEmpty}>No messages yet.</div>
        )}

        <div className={styles.chatMessages}>
          {chat.map((msg) => (
            <div key={msg.id} className={styles.chatMessage}>
              <div className={styles.chatMeta}>
                <span className={styles.chatAuthor}>{msg.author}</span>
                <span className={styles.chatTime}>
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>
              <p>{msg.message}</p>
            </div>
          ))}
        </div>

        {/* INPUT BOX */}
        <div className={styles.chatInputRow}>
          <input
            type="text"
            placeholder="Write a message…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      {/* Portal link */}
      {portalUrl && (
        <div className={styles.portalDisplay}>
          <p>{portalUrl}</p>
        </div>
      )}

      {/* Floating Actions */}
      <div className={styles.actionBarFloating}>
        <button className={styles.actionBtn} onClick={() => setEditOpen(true)}>
          <Pencil size={16} /> Edit
        </button>

        {!portalUrl ? (
          <button className={styles.actionBtn} onClick={generatePortalLink}>
            <Link2 size={16} /> Generate Link
          </button>
        ) : (
          <button className={styles.actionBtn} onClick={copyToClipboard}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        )}

        {portalUrl && (
          <button className={styles.actionBtnDanger} onClick={removePortalLink}>
            <XCircle size={16} /> Remove Link
          </button>
        )}

        <button
          className={styles.actionBtnDanger}
          onClick={() => setDeleteTarget(project.id)}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => {
            setProject(updated);
            setEditOpen(false);
          }}
        />
      )}

      {/* Delete Modal */}
      <DeleteProjectModal
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (pid) => {
          await fetch(`/api/projects/${pid}`, { method: "DELETE" });
          router.push("/dashboard/projects");
        }}
      />
    </div>
  );
}
