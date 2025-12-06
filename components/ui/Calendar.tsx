"use client";

import { useState } from "react";
import styles from "./Calendar.module.scss";

export default function Calendar({
  value,
  onChange,
  onClose,
  showWarningCheck = false,
}: {
  value: string | null;
  onChange: (val: string) => void;
  onClose: () => void;
  showWarningCheck?: boolean;
}) {
  const [month, setMonth] = useState(new Date());
  const [pendingDate, setPendingDate] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  function select(day: number) {
    const y = month.getFullYear();
    const m = month.getMonth();

    const localDate = new Date(y, m, day);
    const utc = new Date(Date.UTC(y, m, day));

    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const isToday = localDate.getTime() === todayOnly.getTime();
    const isLate =
      today.getHours() > 23 ||
      (today.getHours() === 23 && today.getMinutes() >= 30);

    // If user wants the special warning check
    if (showWarningCheck && isToday && isLate) {
      setPendingDate(utc.toISOString().split("T")[0]);
      setShowWarning(true);
      return;
    }

    // Normal selection
    onChange(utc.toISOString().split("T")[0]);
    onClose();
  }

  return (
    <div className={styles.calendarWrap}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          ←
        </button>

        <span>
          {month.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </span>

        <button
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.grid}>
        {Array(firstDay)
          .fill(null)
          .map((_, i) => (
            <div key={"empty-" + i} />
          ))}

        {Array(days)
          .fill(null)
          .map((_, i) => {
            const today = new Date();
            const isToday =
              today.getFullYear() === month.getFullYear() &&
              today.getMonth() === month.getMonth() &&
              today.getDate() === i + 1;

            return (
              <div
                key={i}
                className={`${styles.day} ${isToday ? styles.today : ""}`}
                onClick={() => select(i + 1)}
              >
                {i + 1}
              </div>
            );
          })}
      </div>

      {/* Warning */}
      {showWarning && (
        <div className={styles.warningBox}>
          <p>
            ⚠ Today is almost over — less than <strong>30 minutes</strong> left.
            Use <strong>today</strong> as due date?
          </p>

          <div className={styles.warningActions}>
            <button
              className={styles.cancel}
              onClick={() => {
                setShowWarning(false);
                setPendingDate("");
              }}
            >
              Cancel
            </button>

            <button
              className={styles.confirm}
              onClick={() => {
                onChange(pendingDate);
                setShowWarning(false);
                setPendingDate("");
                onClose();
              }}
            >
              Yes, Set Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
