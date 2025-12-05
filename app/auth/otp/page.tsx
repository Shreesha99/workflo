"use client";

import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import gsap from "gsap";

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
    <div className="auth-page">
      <Card>
        <div className="otp-card">
          <h2 className="title">Login with OTP</h2>
          <p className="subtitle">We’ll send a secure magic link.</p>

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

          <div style={{ marginTop: 30 }}>
            <Button onClick={sendOTP} loading={loading} disabled={loading}>
              Send Link
            </Button>
          </div>

          <div className="auth-link">
            <a href="/auth/login">Back to Login</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
