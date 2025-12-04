"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { supabaseClient } from "@/lib/supabase/client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import styles from "./settings.module.scss";

export default function SettingsPage() {
  const supabase = supabaseClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setUsername(profile.username || "");
        if (profile.avatar_url) {
          setAvatarPreview(profile.avatar_url);
        }
      }

      gsap.fromTo(
        `.${styles.container}`,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }

    loadProfile();
  }, []);

  // Update profile fields
  async function handleSave() {
    setError("");
    setSuccess("");
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const updates = {
      display_name: displayName,
      username,
    };

    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Profile updated successfully!");
  }

  // Handle avatar upload
  async function handleAvatarUpload() {
    setError("");
    setSuccess("");

    if (!avatarFile) {
      setError("Please select an image.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const fileName = `${user.id}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data: url } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    await supabase
      .from("user_profiles")
      .update({ avatar_url: url.publicUrl })
      .eq("id", user.id);

    setAvatarPreview(url.publicUrl);
    setSuccess("Avatar updated!");
  }

  return (
    <div className={styles.container}>
      <h1>Settings</h1>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {/* PROFILE INFO */}
      <div className={styles.section}>
        <h2>Profile</h2>

        <Input
          label="Display Name"
          value={displayName}
          placeholder="John Doe"
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <Input
          label="Username"
          value={username}
          placeholder="john123"
          onChange={(e) => setUsername(e.target.value)}
        />

        <Input label="Email" value={email} placeholder="" onChange={() => {}} />
      </div>

      <Button loading={loading} onClick={handleSave}>
        Save Changes
      </Button>

      {/* AVATAR UPLOAD */}
      <div className={styles.section}>
        <h2>Avatar</h2>

        {avatarPreview && (
          <img src={avatarPreview} className={styles.avatarPreview} />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setAvatarFile(file);
            if (file) setAvatarPreview(URL.createObjectURL(file));
          }}
        />

        <Button onClick={handleAvatarUpload}>Upload Avatar</Button>
      </div>
    </div>
  );
}
