"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";
import styles from "./set-password.module.scss";

export default function SetPasswordPage() {
  const supabase = supabaseClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function savePassword() {
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }

    await supabase.auth.updateUser({
      data: { has_password: true },
    });

    setSuccess("Password saved! Redirecting...");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1200);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Set Your Password</h2>

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

          <Button onClick={savePassword} className={styles.button}>
            Save Password
          </Button>
        </div>
      </div>
    </div>
  );
}
