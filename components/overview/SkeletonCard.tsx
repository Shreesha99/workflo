"use client";

import React from "react";
import styles from "./skeleton.module.scss";

export default function SkeletonCard({
  small = false,
  height = 60,
}: {
  small?: boolean;
  height?: number;
}) {
  return (
    <div
      className={`${styles.skeleton} ${small ? styles.small : ""}`}
      style={{ height }}
    >
      <div className={styles.shimmer} />
    </div>
  );
}
