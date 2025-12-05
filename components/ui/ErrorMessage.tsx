"use client";
import styles from "./ErrorMessage.module.scss";
import { AlertTriangle } from "lucide-react";

export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className={styles.errorBox}>
      <AlertTriangle className={styles.icon} size={18} />
      <span>{message}</span>
    </div>
  );
}
