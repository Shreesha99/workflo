"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./chat.module.scss";
import { supabaseClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ProjectChat({ params }) {
  const supabase = supabaseClient();
  const { id: projectId } = params;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  // Load initial messages
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*, author_id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      scrollToBottom();
    }

    load();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.project_id !== projectId) return;

          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  function scrollToBottom() {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 80);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    await supabase.from("messages").insert({
      project_id: projectId,
      author_id: user.id,
      text,
    });

    setText("");
  }

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.chatBox} ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.chatMessage}>
            <div className={styles.avatar}>
              {msg.author_id?.slice(0, 2).toUpperCase()}
            </div>
            <div className={styles.bubble}>
              <p>{msg.text}</p>
              <span>
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.inputRow}>
        <Input
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          label={undefined}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
