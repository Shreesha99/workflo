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

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRef = useRef<HTMLTextAreaElement | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatInput, setChatInput] = useState("");

  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState("");

  const idsRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const newestNoteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

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
      setChatError("Failed to send.");
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
      loadChat();

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
            if (payload.eventType === "INSERT" && payload.new) {
              const mid = payload.new.id;
              if (!idsRef.current.has(mid)) {
                idsRef.current.add(mid);
                setChat((prev) => [...prev, payload.new as ChatMessage]);
              }
            }
            if (payload.eventType === "UPDATE" && payload.new) {
              setChat((prev) =>
                prev.map((m) => (m.id === payload.new.id ? payload.new : m))
              );
            }
            if (payload.eventType === "DELETE" && payload.old) {
              idsRef.current.delete(payload.old.id);
              setChat((prev) => prev.filter((m) => m.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    if (id) load();
  }, [id]);

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

  useEffect(() => {
    if (editingId && editingRef.current) {
      const el = editingRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editingId]);

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

  return (
    <div className={styles.container}>
      <ErrorMessage message={error} />

      <button
        className={styles.backBtn}
        onClick={() => router.push("/dashboard/projects")}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className={styles.header}>
        <div>
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
          <strong>Due Date:</strong>{" "}
          {project.due_date
            ? new Date(project.due_date).toLocaleDateString()
            : "—"}
        </p>
      </div>

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
            <div
              key={note.id}
              className={styles.noteCard}
              ref={note.id === notes[0]?.id ? newestNoteRef : null}
            >
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
          {chat.map((msg) => {
            const isEditing = editingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${
                  msg.author === "Admin"
                    ? styles.myMessage
                    : styles.theirMessage
                }`}
              >
                <div className={styles.chatBubbleWrapper}>
                  <div
                    className={`${styles.chatBubble} ${
                      isEditing ? styles.chatBubbleEditing : ""
                    }`}
                  >
                    {isEditing ? (
                      <textarea
                        className={styles.chatEditTextarea}
                        value={editingMsgText}
                        onChange={(e) => setEditingMsgText(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <p className={styles.chatText}>{msg.message}</p>
                    )}
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
            );
          })}
        </div>

        <div ref={chatEndRef}></div>

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

      {portalUrl && (
        <div className={styles.portalBox}>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.portalLink}
          >
            {portalUrl}
            <ArrowUpRight size={20} className={styles.portalLinkIcon} />
          </a>

          <div className={styles.portalActions}>
            <button className={styles.portalIconBtn} onClick={copyToClipboard}>
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

      <div className={styles.actionBarFloating}>
        <button className={styles.actionBtn} onClick={() => setEditOpen(true)}>
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
