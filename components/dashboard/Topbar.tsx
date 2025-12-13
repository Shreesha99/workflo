"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import styles from "./Topbar.module.scss";
import gsap from "gsap";
import { Search, Sun, Moon } from "lucide-react";

export default function Topbar() {
  const supabase = supabaseClient();

  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const menuRef = useRef<HTMLDivElement | null>(null);

  function toggleMenu() {
    setOpen((prev) => !prev);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  /* ============================
     THEME TOGGLE
  ============================ */

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  /* ============================
     LOAD USER
  ============================ */

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

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

  /* ============================
     CLOSE ON OUTSIDE CLICK
  ============================ */

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ============================
     DROPDOWN ANIMATION
  ============================ */

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
      {/* SEARCH */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search projects, tasks, files…"
        />
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        <button className={styles.avatar} onClick={toggleMenu}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className={styles.avatarImg} />
          ) : (
            profile?.username?.charAt(0).toUpperCase() ||
            profile?.email?.charAt(0).toUpperCase() ||
            "U"
          )}
        </button>

        {open && (
          <div className={`${styles.menu} user-menu`} ref={menuRef}>
            {/* PROFILE */}
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

            {/* THEME TOGGLE */}
            <button className={styles.themeToggle} onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            <div className={styles.menuDivider} />

            {/* LOGOUT */}
            <button className={styles.menuItem} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
