"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import NewsTable from "../components/NewsTable";
import { ToastProvider } from "../components/Toast";
import { NewsArticle } from "@/lib/types";

function ArticlesContent() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

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
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>All Articles</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {articles.length} articles in total
            </p>
          </div>
          <Link href="/articles/new" className="btn-primary text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
            <span className="hidden sm:inline">New Article</span>
          </Link>
        </header>

        <div className="px-6 lg:px-8 py-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="skeleton h-10 flex-1 rounded-xl" />
                <div className="skeleton h-10 w-[160px] rounded-xl" />
              </div>
              <div className="skeleton h-[600px] rounded-xl" />
            </div>
          ) : (
            <NewsTable articles={articles} onDelete={handleDelete} />
          )}
        </div>
      </main>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <ToastProvider>
      <ArticlesContent />
    </ToastProvider>
  );
}
