"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./animatedCounter.module.scss";

export default function AnimatedCounter({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const numberRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!numberRef.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.45 }
    );
    gsap.fromTo(
      numberRef.current,
      { innerText: 0 },
      {
        innerText: value,
        duration: 0.9,
        snap: { innerText: 1 },
        ease: "power1.out",
      }
    );
  }, [value]);

  return (
    <div className={styles.counter} ref={ref}>
      <div className={styles.kv}>
        <div className={styles.label}>{label}</div>
        <div className={styles.number}>
          <span ref={numberRef as any}>{value}</span>
        </div>
      </div>
    </div>
  );
}
