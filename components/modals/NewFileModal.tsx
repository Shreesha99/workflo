"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { supabaseClient } from "@/lib/supabase/client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import styles from "./NewFileModal.module.scss";

export default function NewFileModal({ open, onClose, onUploaded }) {
  const supabase = supabaseClient();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Animate modal container only
  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.32, ease: "power2.out" }
      );
    }
  }, [open]);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("created_at", { ascending: false });

      setProjects(data || []);
    }

    if (open) loadProjects();
  }, [open]);

  async function handleUpload() {
    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select a file.");
      return;
    }
    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    setLoading(true);

    const filePath = `${crypto.randomUUID()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file);

    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    // Insert into DB
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { error: insertError } = await supabase.from("files").insert({
      project_id: projectId,
      path: filePath,
      mime_type: file.type,
      size: file.size,
      uploaded_by: user.id,
      created_at: new Date().toISOString(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess("File uploaded successfully!");
    onUploaded?.();

    setTimeout(() => {
      onClose();
      setFile(null);
      setProjectId("");
    }, 700);
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Upload File</h2>

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />

        {/* File Input */}
        <input
          type="file"
          className={styles.fileInput}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {/* Project selection */}
        <label className={styles.label}>Assign to Project</label>
        <select
          className={styles.select}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <Button
          loading={loading}
          onClick={handleUpload}
          className={styles.uploadBtn}
        >
          Upload File
        </Button>
      </div>
    </div>
  );
}
