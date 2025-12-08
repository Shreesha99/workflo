"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import ErrorMessage from "@/components/ui/ErrorMessage";
import styles from "./ClientPortal.module.scss";

type ChatMessage = {
  id: string;
  project_id: string;
  message: string;
  author: string;
  created_at: string;
};

export default function ClientPortal() {
  const { token } = useParams() as { token: string };
  const supabase = supabaseClient();

  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState("");

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatInput, setChatInput] = useState("");

  const idsRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    let channel: any = null;
    async function load() {
      const { data: portalEntry } = await supabase
        .from("project_portal_links")
        .select("project_id")
        .eq("token", token)
        .maybeSingle();

      if (!portalEntry) {
        setError("Invalid or expired portal link.");
        return;
      }

      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", portalEntry.project_id)
        .single();

      if (!projectData) {
        setError("Project not found.");
        return;
      }

      setProject(projectData);
      await loadChat(projectData.id);

      channel = supabase
        .channel("chat:" + projectData.id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "project_chat",
            filter: `project_id=eq.${projectData.id}`,
          },
          (payload: any) => {
            if (payload.eventType === "INSERT" && payload.new) {
              const id = payload.new.id;
              if (!idsRef.current.has(id)) {
                idsRef.current.add(id);
                setChat((prev) => [...prev, payload.new as ChatMessage]);
              }
            }
            if (payload.eventType === "UPDATE" && payload.new) {
              setChat((prev) =>
                prev.map((m) => (m.id === payload.new.id ? payload.new : m))
              );
            }
            if (payload.eventType === "DELETE" && payload.old) {
              const oldId = payload.old.id;
              idsRef.current.delete(oldId);
              setChat((prev) => prev.filter((m) => m.id !== oldId));
            }
          }
        )
        .subscribe();
    }

    if (token) load();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [token]);

  async function loadChat(projectId: string) {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}?chat=true`);
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
    if (!chatInput.trim() || !project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}?chat=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: chatInput.trim(),
          author: "Client",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setChatInput("");
    } catch {
      setChatError("Message failed.");
    }
  }

  if (error)
    return (
      <div className={styles.portalContainer}>
        <ErrorMessage message={error} />
      </div>
    );

  if (!project)
    return (
      <div className={styles.portalContainer}>
        <p>Loading…</p>
      </div>
    );

  return (
    <div className={styles.portalContainer}>
      <div className={styles.portalHeader}>
        <h1>{project.name}</h1>
        <span
          className={`${styles.status} ${styles[project.status.toLowerCase()]}`}
        >
          {project.status}
        </span>
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

      <div className={styles.section}>
        <h2>Client Portal</h2>
        <p>You may chat directly with the project admin.</p>
      </div>

      <div className={styles.chatSection}>
        <h2>Chat with Admin</h2>

        {chatLoading && <p>Loading chat…</p>}
        {chatError && <ErrorMessage message={chatError} />}

        <div className={styles.chatMessages}>
          {chat.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.chatMessage} ${
                msg.author === "Client" ? styles.myMessage : styles.theirMessage
              }`}
            >
              <div className={styles.chatBubble}>{msg.message}</div>

              <div className={styles.chatMeta}>
                <span>{msg.author}</span>
                <span>
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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
