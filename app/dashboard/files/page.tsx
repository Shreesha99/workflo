"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "./files.module.scss";

import NewFileModal from "@/components/modals/NewFileModal";
import EditFileModal from "@/components/modals/EditFileModal";
import DeleteFileModal from "@/components/modals/DeleteFileModal";

import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import { Download, Pencil, Trash2, Plus, Filter, Search } from "lucide-react";
import { File as FileIconLucide, FileImage, FileVideo } from "lucide-react";

export default function FilesPage() {
  const supabase = supabaseClient();

  const [files, setFiles] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");

  const filterRef = useRef<HTMLDivElement | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingFile, setEditingFile] = useState<any | null>(null);
  const [deletingFile, setDeletingFile] = useState<any | null>(null);

  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<
    Record<string, boolean>
  >({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ============================
     Auto clear alerts
     ============================ */
  useEffect(() => {
    let t1: any, t2: any;

    if (success) t1 = setTimeout(() => setSuccess(""), 2500);
    if (error) t2 = setTimeout(() => setError(""), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [success, error]);

  /* ============================
     Close dropdown on outside click
     ============================ */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }

    if (filtersOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filtersOpen]);

  /* ============================
     Load Files
     ============================ */
  async function loadFiles() {
    const { data, error } = await supabase
      .from("files")
      .select("*, projects(name)")
      .order("created_at", { ascending: false });

    if (error) return setError(error.message);
    setFiles(data || []);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  /* ============================
     Animate cards
     ============================ */
  useEffect(() => {
    gsap.fromTo(
      ".file-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }
    );
  }, [files]);

  /* ============================
     Filters
     ============================ */
  const uniqueProjects = [
    ...new Set(files.map((f) => f.projects?.name).filter(Boolean)),
  ];

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const filtered = files.filter((f) => {
    const display = (f.display_name ?? f.path ?? "").toLowerCase();
    const searchMatch = display.includes(search.toLowerCase());

    let typeMatch = true;
    if (typeFilter === "images") typeMatch = f.mime_type?.startsWith("image/");
    if (typeFilter === "videos") typeMatch = f.mime_type?.startsWith("video/");
    if (typeFilter === "pdf") typeMatch = f.mime_type === "application/pdf";
    if (typeFilter === "other")
      typeMatch =
        !f.mime_type?.startsWith("image/") &&
        !f.mime_type?.startsWith("video/") &&
        f.mime_type !== "application/pdf";

    const projectMatch = projectFilter
      ? f.projects?.name === projectFilter
      : true;

    let sizeMatch = true;
    if (sizeFilter === "small") sizeMatch = f.size < 500 * 1024;
    if (sizeFilter === "medium")
      sizeMatch = f.size >= 500 * 1024 && f.size < 3 * 1024 * 1024;
    if (sizeFilter === "large") sizeMatch = f.size >= 3 * 1024 * 1024;

    return searchMatch && typeMatch && projectMatch && sizeMatch;
  });

  /* ============================
     Signed URL
     ============================ */
  async function createSignedUrl(path: string, expires = 120) {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(path, expires);

    return data?.signedUrl || null;
  }

  const ensurePreview = useCallback(
    async (path: string, mime: string) => {
      if (!mime?.startsWith("image/")) return null;
      if (previewMap[path]) return previewMap[path];

      setLoadingPreviews((s) => ({ ...s, [path]: true }));
      const url = await createSignedUrl(path, 60);
      setLoadingPreviews((s) => ({ ...s, [path]: false }));

      if (url) {
        setPreviewMap((m) => ({ ...m, [path]: url }));
        return url;
      }
      return null;
    },
    [previewMap]
  );

  /* ============================
     Download
     ============================ */
  async function downloadFile(path: string, displayName?: string) {
    const signed = await createSignedUrl(path, 120);
    if (!signed) return setError("Could not generate secure URL.");

    const res = await fetch(signed);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = displayName || path.split("/").pop() || "file";
    a.click();
    URL.revokeObjectURL(url);

    setSuccess("Download started!");
  }

  /* ============================
     Delete File
     ============================ */
  async function executeDelete(fileId: string, path: string) {
    await supabase.storage.from("project-files").remove([path]);
    await supabase.from("files").delete().eq("id", fileId);
    await loadFiles();
    setDeletingFile(null);
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Files</h1>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {/* FILTER BAR */}
      <div className={styles.filtersRow}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <input
            placeholder="Search files..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className={styles.searchIcon} size={16} />
        </div>

        {/* Filter Button */}
        <div className={styles.filterWrap}>
          <button
            className={styles.filterBtn}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <Filter size={16} /> Filters
          </button>

          {filtersOpen && (
            <div ref={filterRef} className={styles.filterDropdown}>
              <div
                className={styles.filterCloseBtn}
                onClick={() => setFiltersOpen(false)}
              >
                ✕
              </div>

              {/* FILE TYPE */}
              <div className={styles.dropdownSection}>
                <label>File Type</label>

                <div
                  className={`${styles.dropdownItem} ${
                    typeFilter === "images" ? styles.activeItem : ""
                  }`}
                  onClick={() => setTypeFilter("images")}
                >
                  Images
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    typeFilter === "videos" ? styles.activeItem : ""
                  }`}
                  onClick={() => setTypeFilter("videos")}
                >
                  Videos
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    typeFilter === "pdf" ? styles.activeItem : ""
                  }`}
                  onClick={() => setTypeFilter("pdf")}
                >
                  PDFs
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    typeFilter === "other" ? styles.activeItem : ""
                  }`}
                  onClick={() => setTypeFilter("other")}
                >
                  Other
                </div>

                <div
                  className={styles.dropdownClear}
                  onClick={() => setTypeFilter("")}
                >
                  Clear
                </div>
              </div>

              <div className={styles.divider} />

              {/* PROJECT FILTER */}
              <div className={styles.dropdownSection}>
                <label>Project</label>

                {uniqueProjects.map((p) => (
                  <div
                    key={p}
                    className={`${styles.dropdownItem} ${
                      projectFilter === p ? styles.activeItem : ""
                    }`}
                    onClick={() => setProjectFilter(p)}
                  >
                    {p}
                  </div>
                ))}

                <div
                  className={styles.dropdownClear}
                  onClick={() => setProjectFilter("")}
                >
                  Clear
                </div>
              </div>

              <div className={styles.divider} />

              {/* SIZE FILTER */}
              <div className={styles.dropdownSection}>
                <label>File Size</label>

                <div
                  className={`${styles.dropdownItem} ${
                    sizeFilter === "small" ? styles.activeItem : ""
                  }`}
                  onClick={() => setSizeFilter("small")}
                >
                  Small (&lt;500KB)
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    sizeFilter === "medium" ? styles.activeItem : ""
                  }`}
                  onClick={() => setSizeFilter("medium")}
                >
                  Medium (0.5–3MB)
                </div>

                <div
                  className={`${styles.dropdownItem} ${
                    sizeFilter === "large" ? styles.activeItem : ""
                  }`}
                  onClick={() => setSizeFilter("large")}
                >
                  Large (&gt;3MB)
                </div>

                <div
                  className={styles.dropdownClear}
                  onClick={() => setSizeFilter("")}
                >
                  Clear
                </div>
              </div>

              {/* Clear All */}
              <button
                className={styles.clearAllBtn}
                onClick={() => {
                  setTypeFilter("");
                  setProjectFilter("");
                  setSizeFilter("");
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {files.length === 0 && (
        <div className={styles.empty}>No files uploaded.</div>
      )}

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.length === 0 && files.length !== 0 && (
          <div className={styles.empty}>No files match the filter.</div>
        )}
        {filtered.map((file) => {
          const isImage = file.mime_type?.startsWith("image/");
          const display = file.display_name ?? file.path;

          return (
            <div key={file.id} className={`file-card ${styles.card}`}>
              <div className={styles.previewWrap}>
                {isImage ? (
                  <ImagePreview
                    path={file.path}
                    mime={file.mime_type}
                    ensurePreview={ensurePreview}
                    previewUrl={previewMap[file.path]}
                    loading={!!loadingPreviews[file.path]}
                  />
                ) : (
                  <FileIcon ext={file.extension} mime={file.mime_type} />
                )}
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.fileTitle}>{display}</h3>

                <div className={styles.meta}>
                  <span>{file.mime_type}</span>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>

                <div className={styles.meta}>
                  <span>{file.projects?.name || "No Project"}</span>
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => downloadFile(file.path, file.display_name)}
                  >
                    <Download size={18} />
                  </button>

                  <button
                    className={styles.iconBtn}
                    onClick={() => setEditingFile(file)}
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={() => setDeletingFile(file)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      <NewFileModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onUploaded={loadFiles}
      />

      {editingFile && (
        <EditFileModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSaved={loadFiles}
        />
      )}

      {deletingFile && (
        <DeleteFileModal
          file={deletingFile}
          onClose={() => setDeletingFile(null)}
          onConfirm={() => executeDelete(deletingFile.id, deletingFile.path)}
        />
      )}

      {/* FAB */}
      <button className={styles.fab} onClick={() => setOpenModal(true)}>
        <Plus size={30} />
      </button>
    </div>
  );
}

/* ============================
   Helper Components
   ============================ */

function FileIcon({ ext = "", mime = "" }) {
  const iconStyles = { width: 42, height: 42 };

  if (mime.startsWith("video/")) return <FileVideo style={iconStyles} />;
  if (mime.startsWith("image/")) return <FileImage style={iconStyles} />;

  return <FileIconLucide style={iconStyles} />;
}

function ImagePreview({ path, mime, ensurePreview, previewUrl, loading }) {
  const [url, setUrl] = useState(previewUrl);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (previewUrl) {
        setUrl(previewUrl);
        return;
      }

      const signed = await ensurePreview(path, mime);
      if (mounted) setUrl(signed);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [path, mime, previewUrl]);

  return (
    <div className={styles.imagePreview}>
      {loading && <div className={styles.previewPlaceholder}>Loading…</div>}
      {!loading && url && <img src={url} alt="" />}
      {!loading && !url && (
        <div className={styles.previewPlaceholder}>No preview</div>
      )}
    </div>
  );
}
