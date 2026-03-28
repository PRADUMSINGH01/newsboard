"use client";

import { NewsArticle } from "@/lib/types";

interface StatsCardsProps {
  articles: NewsArticle[];
}

export default function StatsCards({ articles }: StatsCardsProps) {
  const totalArticles = articles.length;
  const uniqueTags = new Set(articles.map((a) => a.tag).filter(Boolean)).size;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = articles.filter((a) => {
    if (!a.createdAt) return false;
    return new Date(a.createdAt) > sevenDaysAgo;
  }).length;

  const stats = [
    {
      label: "Total Articles",
      value: totalArticles,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
      bgGlow: "rgba(99, 102, 241, 0.08)",
    },
    {
      label: "Categories",
      value: uniqueTags,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
      bgGlow: "rgba(139, 92, 246, 0.08)",
    },
    {
      label: "This Week",
      value: recentCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4" /><path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
      bgGlow: "rgba(16, 185, 129, 0.08)",
    },
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      bgGlow: "rgba(245, 158, 11, 0.08)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`card-glow rounded-2xl p-5 animate-fade-in-up stagger-${i + 1}`}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {stat.value}
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: stat.bgGlow, color: stat.gradient.includes("#6366f1") ? "#818cf8" : stat.gradient.includes("#8b5cf6") ? "#a78bfa" : stat.gradient.includes("#10b981") ? "#34d399" : "#fbbf24" }}
            >
              {stat.icon}
            </div>
          </div>
          <div className="mt-4 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, (Number(String(stat.value).replace(/,/g, "")) / Math.max(totalArticles, 1)) * 100)}%`,
                background: stat.gradient,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
