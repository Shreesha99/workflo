"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import gsap from "gsap";
import styles from "./otp.module.scss";
import Image from "next/image";

type OTPResponse = {
  error?: string;
  message?: string;
};

export default function OTPPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    gsap.fromTo(
      ".otp-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    // Floating elements
    gsap.to(".otp-float1", {
      y: -12,
      x: 10,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    gsap.to(".otp-float2", {
      y: 10,
      x: -14,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  async function sendOTP() {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    let data: OTPResponse = {};

    try {
      data = await res.json();
    } catch {
      setError("Server error. Try again later.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to send magic link.");
      return;
    }

    setSuccess("Magic login link sent! Check your email.");
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Floating Decorative SVGs */}
      <Image
        src="/illustrations/income.svg"
        width={260}
        height={260}
        alt=""
        className={`otp-float1 ${styles.float1}`}
      />

      <Image
        src="/illustrations/money.svg"
        width={260}
        height={260}
        alt=""
        className={`otp-float2 ${styles.float2}`}
      />

      <Card>
        <div className={`otp-card ${styles.card}`}>
          <h2 className={styles.title}>Login with Magic Link</h2>
          <p className={styles.subtitle}>We’ll send a secure login link.</p>

          <ErrorMessage message={error} />
          <SuccessMessage message={success} />

          <div className={styles.inputWrap}>
            <Input
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <Button
            className={styles.fullWidthBtn}
            onClick={sendOTP}
            loading={loading}
            disabled={loading}
          >
            Send Magic Link
          </Button>

          <div className={styles.authLink}>
            <a href="/auth/login">Back to Login</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
