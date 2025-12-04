"use client";

import { useEffect, useMemo, useState } from "react";
import gsap from "gsap";
import styles from "./overview.module.scss";
import { supabaseClient } from "@/lib/supabase/client";

import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

import SkeletonCard from "@/components/overview/SkeletonCard";
import AnimatedCounter from "@/components/overview/AnimatedCounter";
import ActivityFeed from "@/components/overview/ActivityFeed";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

export default function OverviewPage() {
  const supabase = supabaseClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    tasksDue: 0,
    approvals: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    todo: 0,
    progress: 0,
    completed: 0,
  });
  const [tasksOverTime, setTasksOverTime] = useState<[string, number][]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      // counts (head requests)
      const { count: active } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const today = new Date().toISOString().split("T")[0];
      const { count: due } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("due_date", today);

      const { count: approvals } = await supabase
        .from("approvals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // recent projects
      const { data: recent } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      // status counts
      const { data: tasks } = await supabase.from("tasks").select("status");
      const counts = { todo: 0, progress: 0, completed: 0 };
      (tasks || []).forEach((t: any) => {
        const s = (t.status || "todo").toLowerCase();
        if (s === "todo") counts.todo++;
        else if (s === "in progress") counts.progress++;
        else counts.completed++;
      });

      // tasks over time (last 14 days)
      const since = new Date();
      since.setDate(since.getDate() - 13);
      const { data: created } = await supabase
        .from("tasks")
        .select("created_at")
        .gte("created_at", since.toISOString());

      const map: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        map[label] = 0;
      }
      (created || []).forEach((t: any) => {
        const label = new Date(t.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (label in map) map[label] += 1;
      });

      const series = Object.entries(map);

      // activity feed - latest messages, files, tasks, approvals (sample)
      const { data: messages } = await supabase
        .from("messages")
        .select("id, text, created_at, author_id, project_id")
        .order("created_at", { ascending: false })
        .limit(10);

      const act = (messages || []).map((m: any) => ({
        id: `msg-${m.id}`,
        type: "message",
        text: m.text,
        created_at: m.created_at,
        project_id: m.project_id,
      }));

      if (!mounted) return;

      setStats({
        activeProjects: active ?? 0,
        tasksDue: due ?? 0,
        approvals: approvals ?? 0,
      });
      setRecentProjects(recent || []);
      setStatusCounts(counts);
      setTasksOverTime(series);
      setActivity(act);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Realtime subscription (D)
  useEffect(() => {
    const sup = supabase
      .channel("public:overview")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          // prepend message into activity
          setActivity((prev) =>
            [
              {
                id: `msg-${payload.new.id}`,
                type: "message",
                text: payload.new.text,
                created_at: payload.new.created_at,
                project_id: payload.new.project_id,
              },
              ...prev,
            ].slice(0, 20)
          );
        }
      )
      .subscribe();

    return () => {
      sup.unsubscribe();
    };
  }, [supabase]);

  // GSAP fade
  useEffect(() => {
    gsap.fromTo(
      ".overview-fade",
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }
    );
  }, [loading]);

  // Chart data (memoized)
  const doughnutData = useMemo(() => {
    return {
      labels: ["To Do", "In Progress", "Completed"],
      datasets: [
        {
          data: [
            statusCounts.todo,
            statusCounts.progress,
            statusCounts.completed,
          ],
          backgroundColor: ["#FFF4C5", "#CFE8FF", "#CFF8D8"],
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }, [statusCounts]);

  const lineData = useMemo(() => {
    return {
      labels: tasksOverTime.map((t) => t[0]),
      datasets: [
        {
          data: tasksOverTime.map((t) => t[1]),
          borderColor: "#5DA9E9",
          backgroundColor: function (context: any) {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(93,169,233,0.2)");
            gradient.addColorStop(1, "rgba(93,169,233,0.02)");
            return gradient;
          },
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    };
  }, [tasksOverTime]);

  const doughnutOptions = {
    cutout: "70%",
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: {
        padding: 8,
        cornerRadius: 8,
      },
    },
  };

  const lineOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "var(--text-soft)" } },
      y: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: { color: "var(--text-soft)" },
      },
    },
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow + " overview-fade"}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.subtitle}>A quick snapshot of your workspace.</p>
        </div>

        <div className={styles.headerRight}>
          {/* Animated counters */}
          <div className={styles.counters}>
            {loading ? (
              <>
                <SkeletonCard small />
                <SkeletonCard small />
                <SkeletonCard small />
              </>
            ) : (
              <>
                <AnimatedCounter
                  label="Projects"
                  value={stats.activeProjects}
                />
                <AnimatedCounter label="Due Today" value={stats.tasksDue} />
                <AnimatedCounter label="Approvals" value={stats.approvals} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* STAT + CHARTS */}
      <div className={styles.gridRow}>
        <div className={styles.leftCol}>
          <div className={styles.statsRow}>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <div className={`${styles.statCard} overview-fade`}>
                  <h4>Active Projects</h4>
                  <p className={styles.statValue}>{stats.activeProjects}</p>
                </div>

                <div className={`${styles.statCard} overview-fade`}>
                  <h4>Tasks Due Today</h4>
                  <p className={styles.statValue}>{stats.tasksDue}</p>
                </div>

                <div className={`${styles.statCard} overview-fade`}>
                  <h4>Pending approvals</h4>
                  <p className={styles.statValue}>{stats.approvals}</p>
                </div>
              </>
            )}
          </div>

          <div className={styles.chartsRow}>
            <div className={`${styles.chartCard} overview-fade`}>
              <h4>Task Status</h4>
              {loading ? (
                <SkeletonCard height={220} />
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>

            <div className={`${styles.chartCard} overview-fade`}>
              <h4>Tasks Created (14d)</h4>
              {loading ? (
                <SkeletonCard height={220} />
              ) : (
                <Line data={lineData} options={lineOptions} />
              )}
            </div>
          </div>

          <h3 className={`${styles.sectionTitle} overview-fade`}>
            Recent Projects
          </h3>
          <div className={styles.projectsRow}>
            {loading ? (
              <>
                <SkeletonCard height={100} />
                <SkeletonCard height={100} />
                <SkeletonCard height={100} />
              </>
            ) : (
              recentProjects.map((p: any) => (
                <div
                  key={p.id}
                  className={`${styles.projectCard} overview-fade`}
                >
                  <div className={styles.projectLeft}>
                    <div className={styles.projectAvatar}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.projectName}>{p.name}</div>
                      <div className={styles.projectMeta}>
                        {p.client_name || "—"}
                      </div>
                    </div>
                  </div>
                  <div className={styles.projectRight}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className={styles.rightCol}>
          <div className={`${styles.activityCard} overview-fade`}>
            <h4>Activity</h4>
            <ActivityFeed items={activity} loading={loading} />
          </div>

          <div className={`${styles.quickCard} overview-fade`}>
            <h4>Quick Actions</h4>
            <div className={styles.quickActions}>
              <button
                className={styles.quickBtn}
                onClick={() => (location.href = "/dashboard/projects")}
              >
                New Project
              </button>
              <button
                className={styles.quickBtn}
                onClick={() => (location.href = "/dashboard/tasks")}
              >
                New Task
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
