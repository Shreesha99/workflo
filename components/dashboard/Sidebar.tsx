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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Proflo from "@/components/brand/Proflo";

export default function Sidebar({
  onCollapseChange,
}: {
  onCollapseChange: (v: boolean) => void;
}) {
  const pathname = usePathname();

  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive logic
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 900);

      if (width <= 1160 && width > 900) {
        setCollapsed(true);
      }
      if (width > 1160) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // GSAP entrance
  useEffect(() => {
    gsap.fromTo(
      `.${styles.sidebar}`,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45 }
    );
  }, []);

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
      {isMobile && (
        <button
          className={styles.mobileToggle}
          onClick={() => setOpenMobile(true)}
        >
          <Menu size={22} />
        </button>
      )}

      {isMobile && openMobile && (
        <div className={styles.overlay} onClick={() => setOpenMobile(false)} />
      )}

      <aside
        className={`
          ${styles.sidebar}
          ${openMobile ? styles.open : ""}
          ${collapsed && !isMobile ? styles.collapsed : ""}
        `}
      >
        {isMobile && (
          <button
            className={styles.closeBtn}
            onClick={() => setOpenMobile(false)}
          >
            <X size={22} />
          </button>
        )}

        {!isMobile && (
          <button
            className={styles.collapseToggle}
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              onCollapseChange(next);
            }}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}

        {/* BRAND */}
        <div className={styles.brand}>
          <Proflo isMobile={isMobile} isCollapsed={collapsed} />
        </div>

        {/* NAV */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
