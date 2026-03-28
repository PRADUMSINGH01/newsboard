"use client";

import { useState } from "react";
import { NewsFormData } from "@/lib/types";

interface SeoScore {
  overallScore: number;
  scores: {
    titleQuality: { score: number; feedback: string };
    metaDescription: { score: number; feedback: string };
    urlSlug: { score: number; feedback: string };
    contentQuality: { score: number; feedback: string };
    categoryTags: { score: number; feedback: string };
    headlineStructure: { score: number; feedback: string };
  };
  topSuggestions: string[];
  summary: string;
}

interface SeoScorerProps {
  formData: NewsFormData;
}

export default function SeoScorer({ formData }: SeoScorerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoScore | null>(null);
  const [error, setError] = useState("");

  const analyzeArticle = async () => {
    if (!formData.title.trim()) {
      setError("Please enter a title first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/seo-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to analyze");
      }
    } catch {
      setError("Network error. Make sure GEMINI_API_KEY is set in .env.local");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return { color: "#34d399", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)" };
    if (score >= 6) return { color: "#fbbf24", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" };
    if (score >= 4) return { color: "#fb923c", bg: "rgba(249, 115, 22, 0.1)", border: "rgba(249, 115, 22, 0.2)" };
    return { color: "#fca5a5", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Average";
    if (score >= 3) return "Needs Work";
    return "Poor";
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 0 1 5 5c0 2.76-2.24 5-5 5s-5-2.24-5-5a5 5 0 0 1 5-5Z" />
              <path d="M17 7c1.5 0 3 1 3 3s-2 4-3 4" />
              <path d="M7 7c-1.5 0-3 1-3 3s2 4 3 4" />
              <path d="M12 17v5" /><path d="M8 21h8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              AI SEO Analyzer
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Powered by Gemini AI
            </p>
          </div>
        </div>
        <button
          onClick={analyzeArticle}
          disabled={loading}
          className="btn-primary text-xs px-4 py-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {result ? "Re-analyze" : "Analyze SEO"}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3" style={{ background: "rgba(239, 68, 68, 0.05)" }}>
          <p className="text-xs" style={{ color: "#fca5a5" }}>⚠️ {error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="p-5 space-y-3">
          <div className="skeleton h-24 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-20 rounded-xl" />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="p-5 space-y-4 animate-fade-in-up">
          {/* Overall Score */}
          <div className="flex items-center gap-5 p-4 rounded-xl" style={{ background: "var(--bg-primary)" }}>
            <div className="relative">
              <svg width="80" height="80" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
                {/* Score circle */}
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={getScoreColor(result.overallScore).color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.overallScore / 10) * 213.6} 213.6`}
                  transform="rotate(-90 40 40)"
                  style={{ transition: "stroke-dasharray 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: getScoreColor(result.overallScore).color }}>
                  {result.overallScore}
                </span>
                <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>/10</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: getScoreColor(result.overallScore).color }}
                >
                  {getScoreLabel(result.overallScore)}
                </span>
                <span
                  className="badge text-[10px]"
                  style={{
                    background: getScoreColor(result.overallScore).bg,
                    color: getScoreColor(result.overallScore).color,
                    border: `1px solid ${getScoreColor(result.overallScore).border}`,
                  }}
                >
                  SEO Score
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {result.summary}
              </p>
            </div>
          </div>

          {/* Individual Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(result.scores).map(([key, val]) => {
              const sc = getScoreColor(val.score);
              const labels: Record<string, string> = {
                titleQuality: "📝 Title Quality",
                metaDescription: "📋 Meta Description",
                urlSlug: "🔗 URL / Slug",
                contentQuality: "📰 Content Quality",
                categoryTags: "🏷️ Category & Tags",
                headlineStructure: "🎯 Headline Structure",
              };
              return (
                <div
                  key={key}
                  className="rounded-xl p-3"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {labels[key] || key}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                    >
                      {val.score}/10
                    </span>
                  </div>
                  {/* Score bar */}
                  <div className="h-1.5 rounded-full mb-2" style={{ background: "var(--bg-elevated)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val.score * 10}%`, background: sc.color }}
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {val.feedback}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          {result.topSuggestions && result.topSuggestions.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)" }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: "#a5b4fc" }}>
                💡 Top Suggestions
              </p>
              <ul className="space-y-1.5">
                {result.topSuggestions.map((s, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                      style={{ background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc" }}>
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="px-5 py-6 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Click &quot;Analyze SEO&quot; to get an AI-powered score before publishing
          </p>
        </div>
      )}
    </div>
  );
}
