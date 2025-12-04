"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "./files.module.scss";

import NewFileModal from "@/components/modals/NewFileModal";

export default function FilesPage() {
  const supabase = supabaseClient();

  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  async function loadFiles() {
    const { data } = await supabase
      .from("files")
      .select("*, projects(name)")
      .order("created_at", { ascending: false });

    setFiles(data || []);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".file-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }
    );
  }, [files]);

  const filtered = files.filter((f) =>
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Files</h1>

        <div className={styles.right}>
          <button
            className={styles.newFileBtn}
            onClick={() => setOpenModal(true)}
          >
            + Upload File
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <input
        className={styles.search}
        placeholder="Search files…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.map((file) => (
          <div key={file.id} className={`file-card ${styles.card}`}>
            <h3>{file.path}</h3>

            <div className={styles.meta}>
              <span>Type: {file.mime_type}</span>
              <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
            </div>

            <div className={styles.meta}>
              <span>Project: {file.projects?.name || "No Project"}</span>
              <span>
                Uploaded: {new Date(file.created_at).toLocaleDateString()}
              </span>
            </div>

            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-files/${file.path}`}
              target="_blank"
              className={styles.download}
            >
              Download
            </a>
          </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      <NewFileModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onUploaded={loadFiles}
      />
    </div>
  );
}
