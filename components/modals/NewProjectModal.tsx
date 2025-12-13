"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { supabaseClient } from "@/lib/supabase/client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import Calendar from "@/components/ui/Calendar";

import styles from "./NewProjectModal.module.scss";
import { X } from "lucide-react";

export default function NewProjectModal({ open, onClose, onCreated }) {
  const supabase = supabaseClient();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [dueDate, setDueDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [status] = useState("active");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // RESET state whenever modal opens
  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
      setLoading(false);

      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    }
  }, [open]);

  function resetForm() {
    setName("");
    setClientName("");
    setClientEmail("");
    setDueDate("");
    setError("");
    setSuccess("");
  }

  // CREATE PROJECT
  async function handleCreate() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setError("You must be logged in.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("projects").insert({
      name,
      client_name: clientName || null,
      client_email: clientEmail || null,
      created_by: user.id,
      agency_id: null,
      status,
      due_date: dueDate || null,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    setSuccess("Project created!");

    onCreated?.();

    // 🔥 DO NOT STOP LOADING UNTIL MODAL IS CLOSED
    setTimeout(() => {
      onClose();
      resetForm();
      setLoading(false); // NOW safe
    }, 900);
  }

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        if (loading) return;
        onClose();
        resetForm();
      }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>Create New Project</h2>
          <button
            className={styles.closeBtn}
            onClick={() => {
              onClose();
              resetForm();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Web design"
        />

        <Input
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client zero"
        />

        <Input
          label="Client Email"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="contact@client.com"
        />

        <div className={styles.selectWrap}>
          <label>
            Project Status <span>(New projects are always active)</span>
          </label>
          <select disabled>
            <option>Active</option>
          </select>
        </div>

        <div className={styles.datePickerWrap}>
          <label>Due Date</label>
          <div
            className={styles.dateInput}
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {dueDate || "Select a date"}
          </div>

          {showCalendar && (
            <Calendar
              value={dueDate}
              onChange={(d) => setDueDate(d)}
              onClose={() => setShowCalendar(false)}
              showWarningCheck={true}
            />
          )}
        </div>

        <Button
          loading={loading}
          disabled={loading}
          onClick={handleCreate}
          className={styles.createBtn}
        >
          Create Project
        </Button>
      </div>
    </div>
  );
}
