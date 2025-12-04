"use client";

import { useEffect } from "react";
import gsap from "gsap";
import styles from "@/app/page.module.scss";

export default function Home() {
  useEffect(() => {
    gsap.fromTo(
      ".hero",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.hero}>
        <span className={styles.badge}>Proflo</span>

        <h1 className={styles.title}>
          The simplest way to manage <br /> client work.
        </h1>

        <p className={styles.subtitle}>
          A clean, modern workspace for freelancers & agencies. Share progress,
          tasks, files, and approvals with clients — effortlessly.
        </p>

        <div className={styles.actions}>
          <a href="/auth/register" className={styles.primaryBtn}>
            Get Started
          </a>

          <a href="/auth/login" className={styles.secondaryBtn}>
            Login
          </a>

          <a href="/auth/otp" className={styles.linkBtn}>
            Login with OTP
          </a>
        </div>
      </main>
    </div>
  );
}
