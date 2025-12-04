import "@/styles/dashboard.scss";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <Sidebar />
      </aside>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <Topbar />
        </div>

        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
