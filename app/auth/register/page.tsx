"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import gsap from "gsap";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    gsap.fromTo(
      ".signup-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, []);

  async function handleSignup() {
    setError("");
    setSuccess("");

    if (!email || !password || !username) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
    } else {
      setSuccess("Account created! Please check your email.");

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1000);
    }
  }

  return (
    <div className="auth-page">
      <Card>
        <div className="signup-card">
          <h2 className="title">Create Your Account</h2>
          <p className="subtitle">Start your journey with Proflo.</p>

          <ErrorMessage message={error} />
          <SuccessMessage message={success} />

          <div style={{ marginTop: 24 }}>
            <Input
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourusername"
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div style={{ marginTop: 30 }}>
            <Button onClick={handleSignup} loading={loading} disabled={loading}>
              Sign Up
            </Button>
          </div>

          <div className="auth-link">
            <a href="/auth/login">Already have an account? Login</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
