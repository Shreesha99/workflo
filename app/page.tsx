"use client";

import { useEffect } from "react";
import gsap from "gsap";
import styles from "@/app/page.module.scss";
import Proflo from "@/components/brand/Proflo";
import Link from "next/link";

export default function Home() {
  useEffect(() => {
    gsap.fromTo(
      ".hero-section",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <main className={`${styles.heroSection} hero-section`}>
        <Proflo />

        <div className={styles.textBlock}>
          <h1 className={styles.title}>
            The simplest way to manage <br /> client work.
          </h1>

          <p className={styles.subtitle}>
            A clean, modern workspace for freelancers & agencies. Share
            progress, tasks, files and approvals with clients — effortlessly.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/auth/register" className={styles.primaryBtn}>
            Get Started
          </Link>

          <Link href="/auth/login" className={styles.secondaryBtn}>
            Login
          </Link>

          <Link href="/auth/otp" className={styles.linkBtn}>
            Login with Link
          </Link>
        </div>
      </main>
    </div>
  );
}
