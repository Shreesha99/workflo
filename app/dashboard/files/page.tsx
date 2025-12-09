"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import gsap from "gsap";
import styles from "./files.module.scss";

import NewFileModal from "@/components/modals/NewFileModal";
import EditFileModal from "@/components/modals/EditFileModal";

import ErrorMessage from "@/components/ui/ErrorMessage";
import SuccessMessage from "@/components/ui/SuccessMessage";

import { Download, Pencil, Trash2 } from "lucide-react";

export default function FilesPage() {
  const supabase = supabaseClient();

  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);

  const [previewMap, setPreviewMap] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState({});

  // Messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }
    );
  }, [files]);

  const filtered = files.filter((f) =>
    (f.display_name ?? f.path ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function createSignedUrl(path, expires = 120) {
    const { data, error } = await supabase.storage
      .from("project-files")
      .createSignedUrl(path, expires);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  const ensurePreview = useCallback(
    async (path, mime) => {
      if (!path || !mime?.startsWith("image/")) return null;
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

  async function downloadFile(path, displayName) {
    setError("");
    setSuccess("");

    const url = await createSignedUrl(path, 120);
    if (!url) {
      setError("Could not generate secure download URL.");
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = displayName || path.split("/").pop();
    document.body.appendChild(a);
    a.click();
    a.remove();

    setSuccess("Download started!");
  }

  async function handleDelete(fileId, path) {
    setError("");
    setSuccess("");

    // Delete from storage
    await supabase.storage.from("project-files").remove([path]);

    // Delete DB row
    const { error: dbErr } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setSuccess("File deleted successfully!");
    await loadFiles();
  }

  async function onEditSaved() {
    setEditingFile(null);
    await loadFiles();
    setSuccess("File updated!");
  }

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

      {/* GLOBAL MESSAGES */}
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
          const display = file.display_name ?? file.path ?? "Unnamed";
          const isImage = file.mime_type?.startsWith?.("image/");
          const ext = (file.path ?? "").split(".").pop()?.toLowerCase() ?? "";

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
                  <FileIcon ext={ext} mime={file.mime_type} />
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
                    title="Download"
                  >
                    <Download size={18} />
                  </button>

                  <button
                    className={styles.iconBtn}
                    onClick={() => setEditingFile(file)}
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={() => handleDelete(file.id, file.path)}
                    title="Delete"
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
          onSaved={onEditSaved}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------
    Helper Components
-------------------------------------------------- */

function FileIcon({ ext = "", mime = "" }) {
  const iconMap = {
    pdf: "📕",
    zip: "🗜️",
    doc: "📄",
    docx: "📄",
    csv: "📑",
    xlsx: "📊",
    fig: "🎨",
    psd: "🖌️",
    default: "📁",
  };

  const icon =
    iconMap[ext] || (mime.startsWith("video/") ? "🎞️" : iconMap.default);

  return <div className={styles.fileIcon}>{icon}</div>;
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
  }, [path, mime, previewUrl, ensurePreview]);

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
