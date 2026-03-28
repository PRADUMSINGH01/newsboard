"use client";

import { useState, useEffect, use } from "react";
import Sidebar from "../../../components/Sidebar";
import NewsForm from "../../../components/NewsForm";
import { ToastProvider } from "../../../components/Toast";
import { NewsFormData } from "@/lib/types";

function EditArticleContent({ id }: { id: string }) {
  const [article, setArticle] = useState<(NewsFormData & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/kavita/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        } else {
          setError("Article not found");
        }
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />

      <main className="flex-1 lg:ml-[260px] pb-20 lg:pb-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 glass-strong h-16 flex items-center px-6 lg:px-8"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Edit Kavita</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {article?.title || "Loading..."}
            </p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-6 max-w-7xl">
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-12 rounded-xl" />
                <div className="skeleton h-12 rounded-xl" />
              </div>
              <div className="skeleton h-32 rounded-xl" />
              <div className="skeleton h-64 rounded-xl" />
            </div>
          ) : error ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
              </svg>
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{error}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>This kavita may have been deleted.</p>
            </div>
          ) : (
              <NewsForm mode="edit" initialData={article!} apiEndpoint="/api/kavita" redirectPath="/kavita" />
          )}
        </div>
      </main>
    </div>
  );
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ToastProvider>
      <EditArticleContent id={resolvedParams.id} />
    </ToastProvider>
  );
}
