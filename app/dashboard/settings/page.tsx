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
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Load profile
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
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
      }

      gsap.fromTo(
        `.${styles.container}`,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }

    loadProfile();
  }, []);

  // Save profile info
  async function handleSave() {
    setError("");
    setSuccess("");
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("Not logged in.");
      setLoading(false);
      return;
    }

    // Update user profile fields
    const { error: profileErr } = await supabase.from("user_profiles").upsert({
      id: user.id,
      display_name: displayName,
      username: username,
    });

    setLoading(false);

    if (profileErr) {
      setError(profileErr.message);
      return;
    }

    setSuccess("Profile updated successfully!");
  }

  // Upload avatar
  async function handleAvatarUpload() {
    setError("");
    setSuccess("");
    setUploading(true);

    if (!avatarFile) {
      setError("Please select an image.");
      setUploading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setError("You must be logged in.");
      setUploading(false);
      return;
    }

    const ext = avatarFile.name.split(".").pop();
    const fileName = `avatar-${Date.now()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadErr) {
      setUploading(false);
      setError(uploadErr.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { error: dbErr } = await supabase
      .from("user_profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setUploading(false);

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setAvatarPreview(publicUrl);
    setSuccess("Avatar updated!");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Account Settings</h1>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      <div className={styles.grid}>
        {/* LEFT SIDE — Profile Info */}
        <div className={styles.card}>
          <h2>Profile Information</h2>

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

          <Input label="Email" value={email} disabled onChange={() => {}} />

          <Button loading={loading} onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {/* RIGHT SIDE — Avatar Upload */}
        <div className={styles.card}>
          <h2>Avatar</h2>

          <div className={styles.avatarContainer}>
            {avatarPreview ? (
              <img src={avatarPreview} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>No Avatar</div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setAvatarFile(file);
              if (file) setAvatarPreview(URL.createObjectURL(file));
            }}
          />

          <Button loading={uploading} onClick={handleAvatarUpload}>
            Upload Avatar
          </Button>
        </div>
      </div>
    </div>
  );
}
