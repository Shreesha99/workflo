"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import gsap from "gsap";
import styles from "./Sidebar.module.scss";

import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FolderOpen,
  Settings,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = useState(false);

  // Animate on desktop only
  useEffect(() => {
    gsap.fromTo(
      `.${styles.sidebar}`,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }, []);

  // Disable background scroll when drawer is open
  useEffect(() => {
    if (openMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [openMobile]);

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: "Projects",
      href: "/dashboard/projects",
      icon: <FolderKanban size={18} />,
    },
    {
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare size={18} />,
    },
    {
      label: "Files",
      href: "/dashboard/files",
      icon: <FolderOpen size={18} />,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <>
      {/* MOBILE HAMBURGER */}
      <button
        className={styles.mobileToggle}
        onClick={() => setOpenMobile(true)}
      >
        <Menu size={22} />
      </button>

      {/* MOBILE OVERLAY */}
      {openMobile && (
        <div className={styles.overlay} onClick={() => setOpenMobile(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${openMobile ? styles.open : ""}`}>
        {/* MOBILE CLOSE BUTTON */}
        <button
          className={styles.closeBtn}
          onClick={() => setOpenMobile(false)}
        >
          <X size={22} />
        </button>

        {/* BRAND */}
        <div className={styles.brand}>
          <span className={styles.brandDot}></span>
          <span className={styles.brandLabel}>Proflo</span>
        </div>

        {/* NAVIGATION */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${
                pathname === item.href ? styles.active : ""
              }`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
