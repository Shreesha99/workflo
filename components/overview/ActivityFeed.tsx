"use client";

import React from "react";
import styles from "./activity.module.scss";

export default function ActivityFeed({
  items = [],
  loading = false,
}: {
  items?: any[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className={styles.feed}>
        <div className={styles.item}>
          <div className={styles.dot} /> Loading…
        </div>
        <div className={styles.item}>
          <div className={styles.dot} /> Loading…
        </div>
        <div className={styles.item}>
          <div className={styles.dot} /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {items.length === 0 && (
        <div className={styles.empty}>No activity yet</div>
      )}
      {items.map((it: any) => (
        <div className={styles.item} key={it.id}>
          <div className={styles.dot} />
          <div className={styles.meta}>
            <div className={styles.text}>{it.text || "Updated"}</div>
            <div className={styles.time}>
              {new Date(it.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
