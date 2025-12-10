"use client";

import { JSX, useCallback, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "./files.module.scss";

import NewFileModal from "@/components/modals/NewFileModal";
import EditFileModal from "@/components/modals/EditFileModal";
import DeleteFileModal from "@/components/modals/DeleteFileModal";

import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import { Download, Pencil, Trash2, Plus } from "lucide-react";
import { File as FileIconLucide, FileImage, FileVideo } from "lucide-react";

export default function FilesPage() {
  const supabase = supabaseClient();

  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingFile, setEditingFile] = useState<any | null>(null);
  const [deletingFile, setDeletingFile] = useState<any | null>(null);

  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<
    Record<string, boolean>
  >({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto clear success & error messages
  useEffect(() => {
    let t1: any, t2: any;

    if (success) {
      t1 = setTimeout(() => setSuccess(""), 2500);
    }
    if (error) {
      t2 = setTimeout(() => setError(""), 4000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [success, error]);

  async function loadFiles() {
    setError("");

    try {
      const { data, error } = await supabase
        .from("files")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setFiles([]);
        return;
      }

      setFiles(data || []);
    } catch (err: any) {
      setError(err?.message || "Could not load files.");
      setFiles([]);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".file-card",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }
    );
  }, [files]);

  const filtered = files.filter((f) =>
    (f.display_name ?? f.path ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function createSignedUrl(path: string, expires = 120) {
    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .createSignedUrl(path, expires);

      if (error || !data?.signedUrl) return null;

      return data.signedUrl;
    } catch {
      return null;
    }
  }

  const ensurePreview = useCallback(
    async (path: string, mime: string) => {
      if (!mime?.startsWith?.("image/")) return null;
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

  async function downloadFile(path: string, displayName?: string) {
    setError("");
    setSuccess("");

    const signed = await createSignedUrl(path, 120);
    if (!signed) {
      setError("Could not generate secure download URL.");
      return;
    }

    try {
      const res = await fetch(signed);
      if (!res.ok) {
        setError("Download failed.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = displayName || path.split("/").pop() || "file";
      a.click();
      URL.revokeObjectURL(url);

      setSuccess("Download started!");
    } catch (err: any) {
      setError(err?.message || "Download failed.");
    }
  }

  async function executeDelete(fileId: string, path: string) {
    setError("");
    setSuccess("");

    try {
      await supabase.storage.from("project-files").remove([path]);

      const { error: dbErr } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      if (dbErr) {
        setError(dbErr.message);
        return;
      }

      setPreviewMap((m) => {
        const c = { ...m };
        delete c[path];
        return c;
      });

      setSuccess("File deleted successfully!");
      await loadFiles();
    } catch (err: any) {
      setError(err?.message || "Delete failed.");
    } finally {
      setDeletingFile(null);
    }
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Files</h1>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={success} />

      {/* SEARCH */}
      <input
        className={styles.search}
        placeholder="Search files…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* FILE GRID */}
      <div className={styles.grid}>
        {filtered.map((file) => {
          const isImage = file.mime_type?.startsWith?.("image/");
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

                {/* ACTIONS AT BOTTOM */}
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

/* Helper Components */

function FileIcon({ ext = "", mime = "" }) {
  ext = ext.toLowerCase();
  const iconStyles = { width: 42, height: 42 };

  if (mime?.startsWith("video/")) return <FileVideo style={iconStyles} />;
  if (mime?.startsWith("image/")) return <FileImage style={iconStyles} />;

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
