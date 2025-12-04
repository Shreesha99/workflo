"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import styles from "./Topbar.module.scss";
import gsap from "gsap";
import { Search } from "lucide-react";

export default function Topbar() {
  const supabase = supabaseClient();

  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function toggleMenu() {
    setOpen((prev) => !prev);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  // Fetch full profile info
  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) return;

      // Fetch user_profiles row
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile({
        email: user.email,
        username: profileData?.username ?? null,
        joined: user.created_at,
        avatar_url: profileData?.avatar_url ?? null,
      });

      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }
    }

    loadUser();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dropdown animation
  useEffect(() => {
    if (open) {
      gsap.fromTo(
        ".user-menu",
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
      );
    }
  }, [open]);

  return (
    <header className={styles.topbar}>
      {/* Search Bar */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search projects, tasks, files..."
        />
      </div>

      {/* Right section */}
      <div className={styles.right}>
        {/* Avatar / Initial */}
        <button className={styles.avatar} onClick={toggleMenu}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
          ) : (
            profile?.username?.charAt(0).toUpperCase() ||
            profile?.email?.charAt(0).toUpperCase() ||
            "U"
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className={`${styles.menu} user-menu`} ref={menuRef}>
            {/* PROFILE INFO */}
            <div className={styles.profileSection}>
              <div className={styles.profileAvatarWrapper}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className={styles.profileAvatar}
                  />
                ) : (
                  <div className={styles.profileInitial}>
                    {profile?.username?.charAt(0).toUpperCase() ||
                      profile?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className={styles.profileInfo}>
                {profile?.username && (
                  <p className={styles.username}>{profile.username}</p>
                )}
                <p className={styles.email}>{profile?.email}</p>

                {profile?.joined && (
                  <p className={styles.joined}>
                    Joined: {new Date(profile.joined).toDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.menuDivider} />

            <button className={styles.menuItem} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
