"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./Button.module.scss";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

export default function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  loading = false,
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!btnRef.current) return;

    // Subtle entrance animation
    gsap.from(btnRef.current, {
      opacity: 0,
      y: 6,
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  function handleMouseDown() {
    gsap.to(btnRef.current, {
      scale: 0.96,
      duration: 0.12,
      ease: "power1.out",
    });
  }

  function handleMouseUp() {
    gsap.to(btnRef.current, {
      scale: 1,
      duration: 0.15,
      ease: "power2.out",
    });
  }

  return (
    <button
      ref={btnRef}
      className={`${styles.button} ${loading ? styles.loading : ""} ${
        disabled ? styles.disabled : ""
      } ${className}`}
      onClick={loading || disabled ? undefined : onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      type={type}
      disabled={disabled || loading}
    >
      {loading ? <div className={styles.spinner} /> : children}
    </button>
  );
}
