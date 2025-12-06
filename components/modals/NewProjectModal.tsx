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

  const [showCalendar, setShowCalendar] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [status, setStatus] = useState("active");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // For "time nearly over" modal
  const [pendingDate, setPendingDate] = useState("");
  const [showDateWarning, setShowDateWarning] = useState(false);

  // Animate modal
  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" }
      );
    }
  }, [open]);

  function selectDate(day: number) {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();

    const selectedLocal = new Date(y, m, day);
    const utcDate = new Date(Date.UTC(y, m, day));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isToday = selectedLocal.getTime() === today.getTime();
    const isLate =
      now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 30);

    if (isToday && isLate) {
      setPendingDate(utcDate.toISOString().split("T")[0]);
      setShowDateWarning(true);
      return;
    }

    // Normal save
    setDueDate(utcDate.toISOString().split("T")[0]);
    setShowCalendar(false);
  }

  function getDaysInMonth() {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    return new Date(y, m + 1, 0).getDate();
  }

  async function handleCreate() {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (status !== "active") {
      setError("New project must start active — cannot change status.");
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
      due_date: dueDate || null,
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
      setDueDate("");
      setStatus("active");
      setSuccess("");
    }, 800);
  }

  if (!open) return null;

  const days = getDaysInMonth();
  const firstDay = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay();

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

        {/* ⭐ Custom Date Picker */}
        <div className={styles.datePickerWrap}>
          <label>Due Date</label>

          <div
            className={styles.dateInput}
            onClick={() => setShowCalendar((v) => !v)}
          >
            {dueDate || "Select a date"}
          </div>

          {showCalendar && (
            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() - 1,
                        1
                      )
                    )
                  }
                >
                  ←
                </button>

                <span>
                  {calendarMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>

                <button
                  onClick={() =>
                    setCalendarMonth(
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() + 1,
                        1
                      )
                    )
                  }
                >
                  →
                </button>
              </div>

              <div className={styles.calendarGrid}>
                {Array(firstDay)
                  .fill(null)
                  .map((_, i) => (
                    <div key={"empty-" + i} />
                  ))}
                {Array(days)
                  .fill(null)
                  .map((_, i) => {
                    const dayNumber = i + 1;

                    // Determine if THIS day is today
                    const today = new Date();
                    const isTodayInCalendar =
                      today.getFullYear() === calendarMonth.getFullYear() &&
                      today.getMonth() === calendarMonth.getMonth() &&
                      today.getDate() === dayNumber;

                    return (
                      <div
                        key={i}
                        className={`${styles.day} ${
                          isTodayInCalendar ? styles.today : ""
                        }`}
                        onClick={() => selectDate(dayNumber)}
                      >
                        {dayNumber}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        {showDateWarning && (
          <div className={styles.inlineWarningBox}>
            <p>
              ⚠ Today is almost over — less than <strong>30 minutes</strong>{" "}
              left. Are you sure you want to use <strong>today</strong> as the
              due date?
            </p>

            <div className={styles.inlineWarningActions}>
              <button
                className={styles.inlineCancel}
                onClick={() => {
                  setShowDateWarning(false);
                  setPendingDate("");
                }}
              >
                Cancel
              </button>

              <button
                className={styles.inlineConfirm}
                onClick={() => {
                  setDueDate(pendingDate);
                  setPendingDate("");
                  setShowDateWarning(false);
                  setShowCalendar(false);
                }}
              >
                Yes, Set Today
              </button>
            </div>
          </div>
        )}

        <div className={styles.selectWrap}>
          <label>Status (fixed to Active)</label>
          <select value={status} disabled>
            <option value="active">Active</option>
          </select>
        </div>

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
