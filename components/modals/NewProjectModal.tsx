"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { supabaseClient } from "@/lib/supabase/client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import styles from "./NewProjectModal.module.scss";

export default function NewProjectModal({ open, onClose, onCreated }) {
  const supabase = supabaseClient();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Animate the modal ONLY (not its children)
  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.32, ease: "power2.out" }
      );
    }
  }, [open]);

  async function handleCreate() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("projects").insert({
      name,
      client_name: clientName || null,
      client_email: clientEmail || null,
      created_by: user.id,
      agency_id: null,
      status: "active",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Project created successfully!");
    onCreated?.();

    setTimeout(() => {
      onClose();
      setName("");
      setClientName("");
      setClientEmail("");
      setSuccess("");
    }, 700);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Create New Project</h2>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Brand Identity Design"
        />

        <Input
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="John Doe"
        />

        <Input
          label="Client Email"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="client@example.com"
        />

        <Button
          loading={loading}
          onClick={handleCreate}
          className={styles.createBtn}
        >
          Create Project
        </Button>
      </div>
    </div>
  );
}
