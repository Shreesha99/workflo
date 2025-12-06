"use client";

import styles from "./StatusBadge.module.scss";

export default function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  return (
    <span className={`${styles.badge} ${styles[normalized]}`}>
      {normalized}
    </span>
  );
}
