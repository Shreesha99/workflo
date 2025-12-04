"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "../auth.module.scss";

export default function LoginPage() {
  const supabase = supabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      ".auth-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, []);

  async function handleLogin() {
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  }

  return (
    <div className={styles.authPage}>
      <Card>
        <div className="auth-card">
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
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            className={styles.actionBtn}
            onClick={handleLogin}
            loading={loading}
            disabled={loading}
          >
            Login
          </Button>

          <div className={styles.links}>
            <a href="/auth/otp">Login with magic link</a>
            <a href="/auth/register">Create an account</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
