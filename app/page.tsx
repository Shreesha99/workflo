"use client";

import { useEffect } from "react";
import gsap from "gsap";
import styles from "@/app/page.module.scss";
import Proflo from "@/components/brand/Proflo";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
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

  useEffect(() => {
    // Hero fade-in
    gsap.fromTo(
      ".hero-section",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Floating 3D elements animation
    gsap.to(".float1", {
      y: -12,
      x: 10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    gsap.to(".float2", {
      y: 10,
      x: -30,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    gsap.to(".float3", {
      y: -50,
      x: -30,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  return (
    <div className={styles.pageWrapper}>
      {/* 🎨 Floating Decorative Elements */}
      <Image
        src="/illustrations/house.svg"
        className={`${styles.cursor} float1`}
        width={"300"}
        height={"300"}
        alt={""}
      />
      <Image
        src="/illustrations/income.svg"
        className={`${styles.message} float2`}
        alt={""}
        width={"300"}
        height={"300"}
      />
      <Image
        src="/illustrations/money.svg"
        className={`${styles.spark} float3`}
        alt={""}
        width={"300"}
        height={"300"}
      />

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
