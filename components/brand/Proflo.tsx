"use client";

import React, { useState } from "react";
import styles from "./Proflo.module.scss";

export default function Proflo({
  isMobile = false,
  isCollapsed = false,
}: {
  isMobile?: boolean;
  isCollapsed?: boolean;
}) {
  const [touchActive, setTouchActive] = useState(false);

  // COLLAPSED → show ONLY favicon, no pill
  if (isCollapsed && !isMobile) {
    return (
      <div className={styles.collapsedIconWrapper}>
        <img src="/favicon.ico" className={styles.collapsedIcon} alt="Proflo" />
      </div>
    );
  }

  // NORMAL (expanded + mobile)
  return (
    <div
      className={`${styles.pill} ${touchActive ? styles.active : ""}`}
      onMouseEnter={() => !isMobile && setTouchActive(true)}
      onMouseLeave={() => !isMobile && setTouchActive(false)}
      onTouchStart={() => {
        setTouchActive(true);
        setTimeout(() => setTouchActive(false), 180);
      }}
    >
      <img
        src={isMobile ? "/converted.svg" : "/logo.svg"}
        className={styles.logo}
        alt="Proflo"
      />
    </div>
  );
}
