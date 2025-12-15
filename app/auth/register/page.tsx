"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import gsap from "gsap";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import styles from "./register.module.scss";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  let [disableBtn, btnDisable] = useState(false);

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
    gsap.fromTo(
      ".signup-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    gsap.to(".signup-float1", {
      y: -12,
      x: 10,
      repeat: -1,
      duration: 2.2,
      yoyo: true,
      ease: "power1.inOut",
    });

    gsap.to(".signup-float2", {
      y: 12,
      x: -14,
      repeat: -1,
      duration: 2,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  async function handleSignup() {
    setError("");
    setSuccess("");

    if (!email || !username) {
      setError("All fields are required.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const tempPassword = crypto.randomUUID();

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password: tempPassword,
          hasPassword: false,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned unexpected response.");
      }

      if (res.status === 409) {
        setLoading(false);
        btnDisable(true);
        console.log((data as any).hasPassword);
        if (!(data as any).hasPassword) {
          setSuccess(
            "A setup link has already been sent. Please check your inbox or you can login if you finished setting up"
          );
        }

        return;
      }

      if (!res.ok) {
        setLoading(false);
        setError((data as any).error || "Signup failed.");
        return;
      }

      setLoading(false);
      btnDisable(true);
      setSuccess((data as any).message || "Account created. Check your email.");
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Unexpected error. Try again.");
    }
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Floating Decorative Vectors */}
      <Image
        src="/illustrations/income.svg"
        width={260}
        height={260}
        alt=""
        className={`signup-float1 ${styles.float1}`}
      />

      <Image
        src="/illustrations/money.svg"
        width={260}
        height={260}
        alt=""
        className={`signup-float2 ${styles.float2}`}
      />

      <Card>
        <form
          className={`signup-card ${styles.card}`}
          onSubmit={(e) => {
            e.preventDefault();
            handleSignup();
          }}
        >
          <h2 className={styles.title}>Create Your Account</h2>
          <p className={styles.subtitle}>Start your journey with Proflo.</p>

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

          <div className={styles.inputWrap}>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your username"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={loading || disableBtn}
            className={styles.fullWidthBtn}
          >
            Sign Up
          </Button>

          <div className={styles.authLink}>
            <a href="/auth/login">Already have an account? Login</a>
          </div>
        </form>
      </Card>
    </div>
  );
}
