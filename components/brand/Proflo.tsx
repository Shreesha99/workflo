"use client";

import React, { useState } from "react";
import styles from "./Proflo.module.scss";

/**
 * Proflo brand pill.
 * - Uses CSS module for all styles (avoids inline style typing issues).
 * - Adds hover lift & shadow on pointer devices.
 * - Brief touch feedback on touch devices via onTouchStart.
 */
export default function Proflo() {
  const [touchActive, setTouchActive] = useState(false);

  return (
    <div
      className={`${styles.pill} ${touchActive ? styles.active : ""}`}
      onMouseEnter={() => setTouchActive(true)}
      onMouseLeave={() => setTouchActive(false)}
      onTouchStart={() => {
        // brief visual feedback for touch devices
        setTouchActive(true);
        window.setTimeout(() => setTouchActive(false), 180);
      }}
      role="img"
      aria-label="Proflo"
    >
      <img src="/logo.svg" alt="Proflo" className={styles.logo} />
    </div>
  );
}
