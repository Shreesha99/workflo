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

  const [displayName, setDisplayName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (open && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 0.32, ease: "power2.out" }
      );
    }
  }, [open]);

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

    if (!file) return setError("Please select a file.");
    if (!projectId) return setError("Please select a project.");

    setLoading(true);

    const project = projects.find((p) => p.id === projectId);
    const ext = file.name.split(".").pop();
    const safeName = displayName.trim();

    const finalName = safeName
      ? `${safeName}.${ext}`
      : `${project.name.replace(/\s+/g, "_").toLowerCase()}_${crypto
          .randomUUID()
          .slice(0, 8)}.${ext}`;

    const filePath = `${projectId}/${finalName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file);

    if (uploadError) {
      setLoading(false);
      setError(uploadError.message);
      return;
    }

    // Insert DB entry
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { error: insertError } = await supabase.from("files").insert({
      project_id: projectId,
      path: filePath,
      mime_type: file.type,
      size: file.size,
      uploaded_by: user.id,
      display_name: safeName || finalName,
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
      setDisplayName("");
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

        {/* File Picker */}
        <div
          className={styles.filePicker}
          onClick={() => document.getElementById("hiddenFile").click()}
        >
          <div className={styles.fileLeft}>
            <span className={styles.fileLabel}>
              {file ? file.name : "Choose a file…"}
            </span>
          </div>

          <div className={styles.fileRight}>Browse</div>

          <input
            id="hiddenFile"
            type="file"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Filename input */}
        <Input
          placeholder="Enter file name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        {/* Project Dropdown */}
        <div className={styles.dropdownContainer}>
          <label className={styles.label}>Assign to Project</label>

          <div
            className={styles.dropdown}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <span>
              {projectId
                ? projects.find((p) => p.id === projectId)?.name
                : "Select project"}
            </span>
            <div className={styles.arrow} />
          </div>

          {dropdownOpen && (
            <div className={styles.dropdownList}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setProjectId(p.id);
                    setDropdownOpen(false);
                  }}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

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
