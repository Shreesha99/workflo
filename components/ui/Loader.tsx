"use client";

import styles from "./loader.module.scss";

export default function Loader() {
  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderWrapper}>
        <div className={styles.glow}></div>
        <div className={styles.orb}></div>
        <p className={styles.label}>Loading…</p>
      </div>
    </div>
  );
}
