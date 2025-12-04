"use client";

import { useEffect, useState, use } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "./projectdetails.module.scss";

export default function ProjectDetails(props) {
  const supabase = supabaseClient();

  // ⬅️ FIX: unwrap params promise
  const { id } = use(props.params);

  const [project, setProject] = useState(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [copied, setCopied] = useState(false);
  async function test() {
    const { data } = await supabase.auth.getUser();
    console.log(data.user.id);
  }
  test();
  useEffect(() => {
    let mounted = true;

    async function fetchProject() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (mounted) {
        setProject(data);

        gsap.fromTo(
          ".project-detail",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      }
    }

    fetchProject();

    return () => (mounted = false);
  }, [id]);

  // ------------------------------------
  // ⭐ GENERATE CLIENT PORTAL LINK
  // ------------------------------------
  async function generatePortalLink() {
    const res = await fetch(`/api/projects/${id}/portal`);

    if (!res.ok) {
      console.error("Portal link error", res.status);
      return;
    }

    const data = await res.json().catch(() => null);

    if (!data?.url) {
      console.error("Invalid JSON response");
      return;
    }

    setPortalUrl(data.url);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  // ------------------------------------

  if (!project) return <p>Loading...</p>;

  return (
    <div className={`project-detail ${styles.container}`}>
      <h1>{project.name}</h1>

      {/* ⭐ BUTTON TO GENERATE CLIENT PORTAL LINK */}
      <button className={styles.portalBtn} onClick={generatePortalLink}>
        Generate Client Portal Link
      </button>

      {/* ⭐ SHOW LINK IF GENERATED */}
      {portalUrl && (
        <div className={`portal-box ${styles.portalBox}`}>
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
