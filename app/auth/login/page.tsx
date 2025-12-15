"use client";

import React, { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import Image from "next/image";
import styles from "./login.module.scss";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const supabase = supabaseClient();
  const submittingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
      ".auth-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );

    gsap.to(".login-float1", {
      y: -12,
      x: 10,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    gsap.to(".login-float2", {
      y: 12,
      x: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  async function handleLogin() {
    if (submittingRef.current) return;

    submittingRef.current = true; // 🔒 LOCK IMMEDIATELY
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      submittingRef.current = false;
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      submittingRef.current = false;
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      submittingRef.current = false; // 🔓 unlock on error
      return;
    }

    setSuccess("Login successful! Redirecting...");

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  }

  return (
    <div className={styles.authPage}>
      {/* FLOATING ANIMATED VECTOR IMAGES (THE ONES YOU WANTED) */}
      <Image
        src="/illustrations/income.svg"
        width={260}
        height={260}
        alt=""
        className={`login-float1 ${styles.float1}`}
      />

      <Image
        src="/illustrations/money.svg"
        width={260}
        height={260}
        alt=""
        className={`login-float2 ${styles.float2}`}
      />

      <Card>
        <form
          className={`auth-card ${styles.card}`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!submittingRef.current) {
              handleLogin();
            }
          }}
        >
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Log in to continue your work.</p>

          <ErrorMessage message={error} />
          <SuccessMessage message={success} />

          <div className={styles.inputWrap}>
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className={styles.inputWrap}>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                showPassword ? <EyeOff size={18} /> : <Eye size={18} />
              }
              onRightIconClick={() => setShowPassword((p) => !p)}
            />
          </div>

          <Button
            type="submit"
            className={styles.actionBtn}
            loading={loading}
            disabled={loading}
          >
            Login
          </Button>

          <div className={styles.links}>
            <a href="/auth/otp">Login with magic link</a>
            <a href="/auth/register">Create an account</a>
          </div>
        </form>
      </Card>
    </div>
  );
}
