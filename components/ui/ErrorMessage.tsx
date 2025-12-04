"use client";
import styles from "./ErrorMessage.module.scss";

export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;

  return <div className={styles.error}>{message}</div>;
}
