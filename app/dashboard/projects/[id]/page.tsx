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
  Plus,
  Trash,
  ArrowUpRight,
  Send,
} from "lucide-react";

import styles from "./projectdetails.module.scss";

type ChatMessage = {
  id: string;
  project_id: string;
  message: string;
  author: string;
  created_at: string;
};

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

  // NOTES
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // CHAT
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatInput, setChatInput] = useState("");

  const idsRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Load chat
  async function loadChat() {
    setChatLoading(true);
    setChatError("");

    try {
      const res = await fetch(`/api/projects/${id}?chat=true`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const msgs: ChatMessage[] = json.messages || [];
      setChat(msgs);
      idsRef.current.clear();
      for (const m of msgs) idsRef.current.add(m.id);
    } catch {
      setChatError("Failed to load chat.");
    }

    setChatLoading(false);
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

      setChatInput("");
    } catch {
      setChatError("Failed to send message.");
    }
  }

  // Load project + notes + chat + realtime updates
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
      loadChat();

      // realtime chat
      const channel = supabase
        .channel("chat:" + id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "project_chat",
            filter: `project_id=eq.${id}`,
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              const mid = payload.new.id;
              if (!idsRef.current.has(mid)) {
                idsRef.current.add(mid);
                setChat((prev) => [...prev, payload.new]);
              }
            }
            if (payload.eventType === "UPDATE") {
              setChat((prev) =>
                prev.map((m) => (m.id === payload.new.id ? payload.new : m))
              );
            }
            if (payload.eventType === "DELETE") {
              idsRef.current.delete(payload.old.id);
              setChat((prev) => prev.filter((m) => m.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }

    if (id) load();
  }, [id]);

  // Portal link
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

  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}`);
    const json = await res.json();
    if (!res.ok) return setError("Failed to generate link.");
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

  // Notes
  async function loadNotes() {
    setNotesLoading(true);
    setNotesError("");

    try {
      const res = await fetch(`/api/projects/${id}?notes=true`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotes(json.notes);
    } catch {
      setNotesError("Failed to load notes.");
    }

    setNotesLoading(false);
  }

  async function createNote() {
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
    } catch {
      setNotesError("Failed to create note.");
    }
  }

  async function updateNote(noteId: string, newText: string) {
    setSavingNoteId(noteId);

    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, note_text: newText } : n))
    );

    try {
      const res = await fetch(`/api/projects/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: newText }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
    } catch {
      loadNotes();
    }

    setSavingNoteId(null);
  }

  async function deleteNote(noteId: string) {
    const backup = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      const res = await fetch(`/api/projects/${id}?note=${noteId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
    } catch {
      setNotes(backup);
      setNotesError("Failed to delete note.");
    }
  }

  // Autofocus on edit
  useEffect(() => {
    if (editingId && editingRef.current) {
      const el = editingRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editingId]);

  if (!project) return <p className={styles.loading}>Loading…</p>;

  return (
    <div className={`${styles.wrapper} ${styles[`status-${project.status}`]}`}>
      {/* LEFT COLUMN */}
      <div className={styles.left}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/dashboard/projects")}
        >
          <ArrowLeft size={16} />
        </button>

        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h1>{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
        </div>

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
            <strong>Due:</strong>{" "}
            {project.due_date
              ? new Date(project.due_date).toLocaleDateString()
              : "—"}
          </p>
        </div>

        <div className={styles.notesSection}>
          <div className={styles.notesHeader}>
            <h2>Project Notes</h2>
            <button className={styles.addNoteBtn} onClick={createNote}>
              <Plus size={20} />
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
                      className={`${styles.noteTextarea} ${styles.noteEditing}`}
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
                        }
                        if (e.key === "Escape") {
                          setEditingId(null);
                          loadNotes();
                        }
                      }}
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

                  {savingNoteId === note.id && (
                    <span className={styles.saving}>Saving…</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className={styles.right}>
        <div className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <h3>Chat</h3>
          </div>

          {chatLoading && <div className={styles.chatEmpty}>Loading chat…</div>}
          {chatError && <ErrorMessage message={chatError} />}
          {!chatLoading && chat.length === 0 && (
            <div className={styles.chatEmpty}>No messages yet.</div>
          )}

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
                <div className={styles.chatBubbleWrapper}>
                  <div className={styles.chatBubble}>
                    <p className={styles.chatText}>{msg.message}</p>
                  </div>
                </div>

                <div className={styles.chatMetaRow}>
                  <span className={styles.chatAuthor}>{msg.author}</span>
                  <span className={styles.chatTime}>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            <div ref={chatEndRef}></div>
          </div>

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
            <button onClick={sendMessage}>
              <Send size={16} />
            </button>
          </div>

          {portalUrl && (
            <div className={styles.portalBox}>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.portalLink}
              >
                {portalUrl}
                <ArrowUpRight size={18} className={styles.portalLinkIcon} />
              </a>

              <div className={styles.portalActions}>
                <button
                  className={styles.portalIconBtn}
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>

                <button
                  className={styles.portalRemoveBtn}
                  onClick={removePortalLink}
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionBarFloating}>
          <button
            className={styles.actionBtn}
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={16} /> Edit
          </button>

          <button
            className={styles.actionBtn}
            onClick={generatePortalLink}
            disabled={!!portalUrl}
          >
            <Link2 size={16} /> Generate Link
          </button>

          <button
            className={styles.actionBtnDanger}
            onClick={() => setDeleteTarget(project.id)}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* MODALS */}
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
