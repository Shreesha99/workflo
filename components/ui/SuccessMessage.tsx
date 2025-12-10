"use client";
import { CheckCircle } from "lucide-react";
import styles from "./SuccessMessage.module.scss";

export default function SuccessMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className={styles.success}>
      <CheckCircle size={18} className={styles.icon} />
      <span>{message}</span>
    </div>
  );
}
