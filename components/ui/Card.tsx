"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import styles from "./Card.module.scss";

export default function Card({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, []);

  return (
    <div ref={ref} className={styles.card}>
      {children}
    </div>
  );
}
