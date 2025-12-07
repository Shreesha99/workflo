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

  const [status] = useState("active"); // 🔥 Fixed: default + not changeable
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" }
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
      status, // 🔥 always active
      due_date: dueDate || null,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Project created!");

    onCreated?.();

    setTimeout(() => {
      onClose();
      setName("");
      setClientName("");
      setClientEmail("");
      setDueDate("");
    }, 900);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔥 Header with Close Button */}
        <div className={styles.modalHeader}>
          <h2>Create New Project</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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

        {/* 🔥 STATUS - Always Active */}
        <div className={styles.selectWrap}>
          <label>
            Project Status <span>(New projects are active by default)</span>
          </label>
          <select disabled>
            <option>Active</option>
          </select>
        </div>

        {/* 🔥 Due Date Picker */}
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

        {/* CREATE */}
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
