"use client";

import { useState } from "react";

export default function Proflo() {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => {
        setHover(true);
        setTimeout(() => setHover(false), 180);
      }}
      style={{
        background: "#FFD600",
        padding: "12px 22px",
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",

        // ✨ Hover Animation
        transform: hover
          ? "translateY(-3px) scale(1.03)"
          : "translateY(0) scale(1)",
        boxShadow: hover
          ? "0 8px 18px rgba(0,0,0,0.15)"
          : "0 2px 6px rgba(0,0,0,0.05)",
        transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <img
        src="/logo.svg"
        alt="Proflo Logo"
        style={{
          height: "32px",
          width: "auto",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
