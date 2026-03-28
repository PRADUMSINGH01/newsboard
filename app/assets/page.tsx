"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { ToastProvider, useToast } from "../components/Toast";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  storagePath?: string;
  docId?: string;
}

function AssetsContent() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assetsRef = collection(db, "assets");
        const q = query(assetsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedFiles: UploadedFile[] = snapshot.docs.map(document => {
          const data = document.data();
          return {
            id: document.id,
            docId: document.id,
            name: data.name || "Unnamed File",
            url: data.url || "",
            size: data.size || 0,
            progress: 100,
            status: "done",
            storagePath: data.storagePath || "",
          };
        });
        setFiles(fetchedFiles);
      } catch (error) {
        console.error("Error fetching assets from Firestore:", error);
        showToast("Failed to load historical assets.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [showToast]);

  const uploadFile = useCallback(
    (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = new Date().toISOString().slice(0, 10);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `news-assets/${timestamp}/${id}-${safeName}`;

      const uploadItem: UploadedFile = {
        id,
        name: file.name,
        url: "",
        size: file.size,
        progress: 0,
        status: "uploading",
      };

      setFiles((prev) => [uploadItem, ...prev]);

      try {
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setFiles((prev) =>
              prev.map((f) => (f.id === id ? { ...f, progress } : f))
            );
          },
          (error) => {
            console.error("Upload error:", error.code, error.message);
            let friendlyError = error.message;

            if (error.code === "storage/unauthorized") {
              friendlyError = "Permission denied. Update Firebase Storage rules to allow writes.";
            } else if (error.code === "storage/canceled") {
              friendlyError = "Upload was cancelled.";
            } else if (error.code === "storage/unknown") {
              friendlyError = "Unknown error. Check Firebase Storage is enabled in your project.";
            }

            setFiles((prev) =>
              prev.map((f) =>
                f.id === id
                  ? { ...f, status: "error", error: friendlyError }
                  : f
              )
            );
            showToast(`Failed: ${friendlyError}`, "error");
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              
              const docRef = await addDoc(collection(db, "assets"), {
                name: file.name,
                url,
                size: file.size,
                storagePath,
                createdAt: serverTimestamp()
              });

              setFiles((prev) =>
                prev.map((f) =>
                  f.id === id ? { ...f, status: "done", url, progress: 100, docId: docRef.id, storagePath } : f
                )
              );
              showToast(`${file.name} uploaded!`, "success");
            } catch (err) {
              console.error("getDownloadURL or Firestore error:", err);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === id
                    ? { ...f, status: "error", error: "Failed to save to database" }
                    : f
                )
              );
            }
          }
        );
      } catch (err) {
        console.error("Storage init error:", err);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: "error",
                  error: "Firebase Storage not configured. Enable Storage in Firebase Console first.",
                }
              : f
          )
        );
        showToast("Firebase Storage not configured. Enable it in Firebase Console.", "error");
      }
    },
    [showToast]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const imageFiles = Array.from(fileList).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length === 0) {
        showToast("Please select image files only", "error");
        return;
      }
      imageFiles.forEach(uploadFile);
    },
    [uploadFile, showToast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast("URL copied to clipboard!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      showToast("URL copied!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyAllUrls = async () => {
    const doneFiles = files.filter((f) => f.status === "done");
    if (doneFiles.length === 0) {
      showToast("No uploaded images yet", "error");
      return;
    }
    const allUrls = doneFiles.map((f) => f.url).join("\n");
    try {
      await navigator.clipboard.writeText(allUrls);
      showToast(`${doneFiles.length} URLs copied!`, "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const removeFile = async (fileToRemove: UploadedFile) => {
    if (fileToRemove.status === "uploading") {
      setFiles((prev) => prev.filter((f) => f.id !== fileToRemove.id));
      return;
    }

    try {
      if (fileToRemove.docId) {
        await deleteDoc(doc(db, "assets", fileToRemove.docId));
      }
      if (fileToRemove.storagePath) {
        const fileRef = ref(storage, fileToRemove.storagePath);
        await deleteObject(fileRef).catch((e) => {
           if (e.code !== "storage/object-not-found") throw e;
        });
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileToRemove.id));
      showToast(`${fileToRemove.name} deleted`, "success");
    } catch (err) {
      console.error("Error deleting file:", err);
      showToast("Failed to delete file", "error");
    }
  };

  const retryUpload = (file: UploadedFile) => {
    removeFile(file);
    // Create a placeholder to re-trigger — user needs to re-select
    showToast("Please re-select the file to upload again", "info");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const uploadedCount = files.filter((f) => f.status === "done").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />

      <main className="flex-1 lg:ml-[260px] pb-20 lg:pb-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 glass-strong h-16 flex items-center justify-between px-6 lg:px-8"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Media Assets
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Upload images & get URLs for articles
            </p>
          </div>
          <div className="flex items-center gap-2">
            {uploadedCount > 0 && (
              <button onClick={copyAllUrls} className="btn-secondary text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span className="hidden sm:inline">Copy All URLs</span>
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-6 space-y-6">
          {/* Firebase Storage Help Banner */}
          {errorCount > 0 && (
            <div
              className="rounded-xl p-4 animate-fade-in"
              style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
            >
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                  <path d="M12 9v4" /><path d="M12 17h.01" />
                </svg>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#fbbf24" }}>Firebase Storage Setup Required</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    1. Go to <strong>Firebase Console → Storage</strong> and enable it<br/>
                    2. Set Storage Rules to: <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: "var(--bg-elevated)" }}>allow read, write: if true;</code><br/>
                    3. Make sure your <code>.env.local</code> has <code>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer animate-fade-in-up ${
              dragging ? "scale-[1.01]" : ""
            }`}
            style={{
              borderColor: dragging ? "var(--accent-primary)" : "var(--border-default)",
              background: dragging ? "var(--accent-glow)" : "var(--bg-card)",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  dragging ? "animate-float" : ""
                }`}
                style={{
                  background: dragging
                    ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                    : "var(--bg-elevated)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke={dragging ? "white" : "var(--text-muted)"}
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              <p className="text-base font-semibold mb-1"
                style={{ color: dragging ? "#a5b4fc" : "var(--text-primary)" }}>
                {dragging ? "Drop your images here!" : "Drag & drop images here"}
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                or click to browse • JPG, PNG, WebP, GIF
              </p>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">Single</span>
                <span className="badge badge-success">Bulk Upload</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                // reset so same file can be selected again
                e.target.value = "";
              }}
            />
          </div>

          {/* Upload Stats */}
          {files.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap animate-fade-in">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
              {uploadedCount > 0 && <span className="badge badge-success">{uploadedCount} uploaded</span>}
              {uploadingCount > 0 && <span className="badge badge-warning">{uploadingCount} uploading</span>}
              {errorCount > 0 && <span className="badge badge-danger">{errorCount} failed</span>}
              <button
                onClick={() => setFiles([])}
                className="ml-auto text-xs font-medium transition-colors hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* File Grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className={`card-glow rounded-2xl overflow-hidden animate-fade-in-up stagger-${Math.min(idx + 1, 5)} group`}
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${file.status === "error" ? "rgba(239,68,68,0.3)" : "var(--border-subtle)"}`,
                  }}
                >
                  {/* Image Preview */}
                  <div className="relative h-40 overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    {file.status === "done" && file.url ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : file.status === "uploading" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg className="animate-spin mx-auto mb-2" width="28" height="28" viewBox="0 0 24 24"
                            fill="none" stroke="var(--accent-primary)" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                            {file.progress}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center px-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger)"
                          strokeWidth="1.5" className="mb-2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="m15 9-6 6" /><path d="m9 9 6 6" />
                        </svg>
                        <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--danger)" }}>
                          {file.error || "Upload failed"}
                        </p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {file.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "var(--bg-primary)" }}>
                        <div className="h-full transition-all duration-300"
                          style={{
                            width: `${file.progress}%`,
                            background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                          }}
                        />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(file); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                      style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* File info */}
                  <div className="p-3">
                    <p className="text-xs font-medium truncate mb-1" style={{ color: "var(--text-primary)" }}>
                      {file.name}
                    </p>
                    <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
                      {formatSize(file.size)}
                      {file.status === "done" && <span className="ml-2" style={{ color: "var(--success)" }}>✓ Uploaded</span>}
                      {file.status === "error" && <span className="ml-2" style={{ color: "var(--danger)" }}>✕ Failed</span>}
                    </p>

                    {/* Error retry */}
                    {file.status === "error" && (
                      <button
                        onClick={() => retryUpload(file)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-2"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                          <path d="M16 16h5v5" />
                        </svg>
                        Retry
                      </button>
                    )}

                    {/* Copy URL button */}
                    {file.status === "done" && file.url && (
                      <>
                        <button
                          onClick={() => copyToClipboard(file.url, file.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: copiedId === file.id ? "rgba(16,185,129,0.15)" : "var(--bg-elevated)",
                            color: copiedId === file.id ? "#34d399" : "var(--text-secondary)",
                            border: `1px solid ${copiedId === file.id ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                          }}
                        >
                          {copiedId === file.id ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                              Copy URL
                            </>
                          )}
                        </button>
                        <div
                          className="mt-2 p-2 rounded-lg text-[10px] font-mono break-all leading-relaxed"
                          style={{ background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                        >
                          {file.url.length > 80 ? file.url.slice(0, 80) + "..." : file.url}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && files.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <svg className="mx-auto mb-4 opacity-20" width="64" height="64" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                No images uploaded yet
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Upload images to get shareable URLs for your articles
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
              <svg className="animate-spin mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Loading assets...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <ToastProvider>
      <AssetsContent />
    </ToastProvider>
  );
}
