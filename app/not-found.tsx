"use client";

import { useEffect } from "react";
import gsap from "gsap";
import styles from "./notfound.module.scss";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    gsap.fromTo(
      ".nf-container",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    gsap.fromTo(
      ".nf-404",
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, delay: 0.1, ease: "back.out(1.7)" }
    );
  }, []);

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const root = document.documentElement;

    // only set if user hasn't explicitly chosen before
    if (!root.dataset.theme) {
      root.dataset.theme = prefersDark ? "dark" : "light";
    }
  }, []);

  return (
    <div className={`nf-container ${styles.container}`}>
      <div className={styles.card}>
        <h1 className={`nf-404 ${styles.code}`}>404</h1>
        <p className={styles.text}>
          The page you’re looking for doesn’t exist.
        </p>

        <div className={styles.actions}>
          <a href="/dashboard" className={styles.primaryBtn}>
            Go to Dashboard
          </a>
          <Link href="/" className={styles.secondaryBtn}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
