"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import Image from "next/image";
import gsap from "gsap";
import styles from "./set-password.module.scss";

export default function SetPasswordPage() {
  const supabase = supabaseClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const root = document.documentElement;

    const applyTheme = (e: MediaQueryList | MediaQueryListEvent) => {
      root.dataset.theme = e.matches ? "dark" : "light";
    };

    applyTheme(media);

    media.addEventListener("change", applyTheme);

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, []);

  useEffect(() => {
    // fade in card
    gsap.fromTo(
      ".password-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    // floating animations identical to register
    gsap.to(".password-float1", {
      y: -12,
      x: 10,
      repeat: -1,
      duration: 2.2,
      yoyo: true,
      ease: "power1.inOut",
    });

    gsap.to(".password-float2", {
      y: 12,
      x: -14,
      repeat: -1,
      duration: 2,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  async function savePassword() {
    if (loading) return; // 🔒 prevent double submit

    setError("");
    setSuccess("");
    setLoading(true); // 🔒 lock immediately

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false); // ❌ unlock only on validation error
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false); // ❌ unlock only on error
      return;
    }

    await supabase.auth.updateUser({
      data: { has_password: true },
    });

    setSuccess("Password saved! Redirecting...");

    // ✅ keep loading true until redirect
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1200);
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Floating SVGs (same as register) */}
      <Image
        src="/illustrations/income.svg"
        width={260}
        height={260}
        alt=""
        className={`password-float1 ${styles.float1}`}
      />

      <Image
        src="/illustrations/money.svg"
        width={260}
        height={260}
        alt=""
        className={`password-float2 ${styles.float2}`}
      />

      <form
        className={`password-card ${styles.card}`}
        onSubmit={(e) => {
          e.preventDefault();
          savePassword();
        }}
      >
        <h2 className={styles.title}>Account verified!</h2>
        <p className={styles.subtitle}>Set Your Password</p>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        <div className={styles.form}>
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className={styles.fullWidthBtn}
          >
            Save Password
          </Button>
        </div>
      </form>
    </div>
  );
}
