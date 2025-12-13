"use client";

import "@/styles/dashboard.scss";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`dashboard-container ${collapsed ? "collapsed" : ""}`}>
      {/* SIDEBAR */}
      <Sidebar onCollapseChange={setCollapsed} />

      {/* MAIN */}
      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <Topbar />
        </div>

        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
