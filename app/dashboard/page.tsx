"use client";

import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import styles from "./overview.module.scss";
import { supabaseClient } from "@/lib/supabase/client";

type KPI = {
  projects: number;
  tasks: number;
  completed: number;
  files: number;
};

type MonthlyPoint = number[];

export default function OverviewPage() {
  const supabase = supabaseClient();

  const [kpi, setKpi] = useState<KPI>({
    projects: 0,
    tasks: 0,
    completed: 0,
    files: 0,
  });

  const [tasksByMonth, setTasksByMonth] = useState<MonthlyPoint>(
    Array(12).fill(0)
  );

  const [statusSplit, setStatusSplit] = useState({
    pending: 0,
    progress: 0,
    completed: 0,
  });

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    async function load() {
      const [{ data: projects }, { data: tasks }, { data: files }] =
        await Promise.all([
          supabase.from("projects").select("id"),
          supabase.from("tasks").select("status,created_at"),
          supabase.from("files").select("id"),
        ]);

      if (!projects || !tasks || !files) return;

      const months = Array(12).fill(0);
      const split = { pending: 0, progress: 0, completed: 0 };

      tasks.forEach((t) => {
        months[new Date(t.created_at).getMonth()]++;

        if (t.status === "completed") split.completed++;
        else if (t.status === "in progress") split.progress++;
        else split.pending++;
      });

      setKpi({
        projects: projects.length,
        tasks: tasks.length,
        completed: split.completed,
        files: files.length,
      });

      setTasksByMonth(months);
      setStatusSplit(split);
    }

    load();
  }, [supabase]);

  /* ================= REALTIME ================= */
  useEffect(() => {
    const channel = supabase
      .channel("overview-analytics")

      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => refreshTasks()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => refreshProjects()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "files" },
        () => refreshFiles()
      )
      .subscribe();

    async function refreshTasks() {
      const { data } = await supabase.from("tasks").select("status,created_at");

      if (!data) return;

      const months = Array(12).fill(0);
      const split = { pending: 0, progress: 0, completed: 0 };

      data.forEach((t) => {
        months[new Date(t.created_at).getMonth()]++;

        if (t.status === "completed") split.completed++;
        else if (t.status === "in progress") split.progress++;
        else split.pending++;
      });

      setTasksByMonth(months);
      setStatusSplit(split);
      setKpi((p) => ({ ...p, tasks: data.length, completed: split.completed }));
    }

    async function refreshProjects() {
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      setKpi((p) => ({ ...p, projects: count ?? 0 }));
    }

    async function refreshFiles() {
      const { count } = await supabase
        .from("files")
        .select("*", { count: "exact", head: true });

      setKpi((p) => ({ ...p, files: count ?? 0 }));
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  /* ================= CHART OPTIONS ================= */

  const monthlyChart = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 30, right: 20, bottom: 30, top: 30 },
      xAxis: {
        type: "category",
        data: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
      },
      yAxis: { type: "value" },
      series: [
        {
          data: tasksByMonth,
          type: "bar",
          barWidth: 18,
          itemStyle: {
            color: "#ffd600",
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    }),
    [tasksByMonth]
  );

  const statusChart = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["55%", "75%"],
          label: { show: false },
          data: [
            { value: statusSplit.completed, name: "Completed" },
            { value: statusSplit.progress, name: "In Progress" },
            { value: statusSplit.pending, name: "Pending" },
          ],
        },
      ],
    }),
    [statusSplit]
  );

  return (
    <div className={styles.page}>
      {/* KPI */}
      <div className={styles.kpiRow}>
        <Kpi label="Projects" value={kpi.projects} />
        <Kpi label="Tasks" value={kpi.tasks} />
        <Kpi label="Completed" value={kpi.completed} />
        <Kpi label="Files" value={kpi.files} />
      </div>

      {/* ANALYTICS */}
      <div className={styles.mainRow}>
        <div className={styles.cardLarge}>
          <h3>Tasks Created Per Month</h3>
          <ReactECharts option={monthlyChart} style={{ height: 320 }} />
        </div>

        <div className={styles.cardSmall}>
          <h3>Task Status Breakdown</h3>
          <ReactECharts option={statusChart} style={{ height: 320 }} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.kpiCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
