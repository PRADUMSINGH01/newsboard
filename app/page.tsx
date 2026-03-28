"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Sidebar from "./components/Sidebar";
import StatsCards from "./components/StatsCards";
import NewsTable from "./components/NewsTable";
import { ToastProvider } from "./components/Toast";
import { NewsArticle } from "@/lib/types";

function DashboardContent() {
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
      console.error("Failed to fetch articles:", err);
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
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Welcome back! Here&apos;s your news overview.
            </p>
          </div>
          <Link href="/articles/new" className="btn-primary text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
            <span className="hidden sm:inline">New Article</span>
          </Link>
        </header>

        <div className="px-6 lg:px-8 py-6 space-y-6">
          {loading ? (
            <div className="space-y-6">
              {/* Skeleton stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-2xl" />
                ))}
              </div>
              {/* Skeleton table */}
              <div className="skeleton h-96 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <StatsCards articles={articles} />

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up stagger-3">
                <Link
                  href="/articles/new"
                  className="card-glow rounded-2xl p-5 flex items-center gap-4 group transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Create Article</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Write and publish new content</p>
                  </div>
                </Link>
                <Link
                  href="/articles"
                  className="card-glow rounded-2xl p-5 flex items-center gap-4 group transition-all"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Manage Articles</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>View, edit, or delete articles</p>
                  </div>
                </Link>
                <div
                  className="card-glow rounded-2xl p-5 flex items-center gap-4"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Analytics</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {articles.reduce((s, a) => s + (a.views || 0), 0).toLocaleString()} total views
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Articles */}
              <div className="animate-fade-in-up stagger-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    Recent Articles
                  </h2>
                  <Link
                    href="/articles"
                    className="text-xs font-medium transition-colors hover:underline"
                    style={{ color: "#a5b4fc" }}
                  >
                    View all →
                  </Link>
                </div>
                <NewsTable articles={articles} onDelete={handleDelete} compact />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
