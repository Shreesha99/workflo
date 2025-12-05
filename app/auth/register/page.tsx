// app/auth/register/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import gsap from "gsap";
import { Eye, EyeOff } from "lucide-react";

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

      // If the server returned a user object (immediate creation), we can optionally redirect
      // Here: don't auto-redirect to be safe (backend/email delays). User can click Login.
      // If you still want to redirect when data.user exists uncomment the next lines:
      // if (data.user) {
      //   window.location.href = "/auth/login";
      // }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Unexpected error. Try again.");
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

          <div>
            <Input
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourusername"
            />
          </div>

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              rightIcon={
                showPassword ? <EyeOff size={16} /> : <Eye size={16} />
              }
              onRightIconClick={() => setShowPassword((s) => !s)}
            />
          </div>

          <div>
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
