"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "./projectdetails.module.scss";

export default function ProjectDetails() {
  const supabase = supabaseClient();

  // ✅ CORRECT WAY TO READ DYNAMIC ROUTE PARAMS
  const { id } = useParams() as { id: string };

  const [project, setProject] = useState(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      setProject(data);

      gsap.fromTo(
        ".project-detail",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }

    fetchProject();
  }, [id]);

  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}/portal`);
    const data = await res.json();

    if (data?.url) {
      setPortalUrl(data.url);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!project) return <p>Loading...</p>;

  return (
    <div className={`project-detail ${styles.container}`}>
      <h1>{project.name}</h1>

      <button className={styles.portalBtn} onClick={generatePortalLink}>
        Generate Client Portal Link
      </button>

      {portalUrl && (
        <div className={styles.portalBox}>
          <p>{portalUrl}</p>
          <button className={styles.copyBtn} onClick={copyToClipboard}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {project.client_name && (
        <p className={styles.client}>Client: {project.client_name}</p>
      )}

      {project.client_email && (
        <p className={styles.email}>Email: {project.client_email}</p>
      )}

      <div className={styles.meta}>
        <span>Status: {project.status}</span>
        <span>
          Created: {new Date(project.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className={styles.section}>
        <h2>Project Notes</h2>
        <p>Coming soon…</p>
      </div>
    </div>
  );
}
