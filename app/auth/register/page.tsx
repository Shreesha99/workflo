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
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    if (!email || !password || !username) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      // parse safely
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned unexpected response.");
      }

      if (!res.ok) {
        // 409 => already registered
        if (res.status === 409) {
          setError(data.error || "Email already registered. Try logging in.");
        } else {
          setError(data.error || "Signup failed. Try again.");
        }
        setLoading(false);
        return;
      }

      // success (201)
      setLoading(false);
      setSuccess(data.message || "Account created. Check your email.");
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
        <div className={`signup-card ${styles.card}`}>
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
              placeholder="yourusername"
            />
          </div>

          <div className={styles.inputWrap}>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                showPassword ? <EyeOff size={16} /> : <Eye size={16} />
              }
              onRightIconClick={() => setShowPassword((s) => !s)}
            />
          </div>

          <Button
            onClick={handleSignup}
            loading={loading}
            disabled={loading}
            className={styles.fullWidthBtn}
          >
            Sign Up
          </Button>

          <div className={styles.authLink}>
            <a href="/auth/login">Already have an account? Login</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
