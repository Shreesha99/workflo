"use client";
import styles from "./SuccessMessage.module.scss";

export default function SuccessMessage({ message }: { message: string }) {
  if (!message) return null;

  return <div className={styles.success}>{message}</div>;
}
