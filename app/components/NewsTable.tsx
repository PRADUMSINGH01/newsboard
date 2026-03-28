"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { NewsArticle } from "@/lib/types";
import DeleteModal from "./DeleteModal";
import { useToast } from "./Toast";

interface NewsTableProps {
  articles: NewsArticle[];
  onDelete?: (id: string) => void;
  compact?: boolean;
  basePath?: string;
  apiEndpoint?: string;
  itemLabel?: string;
}

export default function NewsTable({ articles, onDelete, compact = false, basePath = "/articles", apiEndpoint = "/api/news", itemLabel = "Article" }: NewsTableProps) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const PAGE_SIZE = compact ? 5 : 10;

  const tags = useMemo(() => {
    const t = new Set(articles.map((a) => a.tag).filter(Boolean));
    return Array.from(t).sort();
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.author.toLowerCase().includes(search.toLowerCase()) ||
        a.slug.toLowerCase().includes(search.toLowerCase());
      const matchTag = !tagFilter || a.tag === tagFilter;
      return matchSearch && matchTag;
    });
  }, [articles, search, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiEndpoint}/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`${itemLabel} deleted successfully`, "success");
        onDelete?.(deleteTarget.id);
      } else {
        showToast(`Failed to delete ${itemLabel.toLowerCase()}`, "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Filters */}
      {!compact && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              className="input-dark pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-dark w-auto min-w-[160px]"
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {tags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--text-muted)" }}>
                  {itemLabel}
                </th>
                {!compact && (
                  <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell" style={{ color: "var(--text-muted)" }}>
                    Category
                  </th>
                )}
                <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                  Author
                </th>
                {!compact && (
                  <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>
                    Date
                  </th>
                )}
                <th className="text-right text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--text-muted)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p className="text-sm">No articles found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((article) => (
                  <tr
                    key={article.id}
                    className="table-row"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    {/* Article info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {article.img && (
                          <img
                            src={article.img}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 hidden sm:block"
                            style={{ border: "1px solid var(--border-subtle)" }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[250px] lg:max-w-[350px]" style={{ color: "var(--text-primary)" }}>
                            {article.title}
                          </p>
                          <p className="text-xs truncate max-w-[200px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            /{article.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    {!compact && (
                      <td className="px-4 py-3 hidden md:table-cell">
                        {article.tag && (
                          <span className="badge badge-accent">{article.tag}</span>
                        )}
                      </td>
                    )}

                    {/* Author */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {article.avatar && (
                          <img src={article.avatar} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {article.author}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    {!compact && (
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {article.createdAt
                            ? new Date(article.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`${basePath}/${article.id}/edit`}
                          className="p-2 rounded-lg transition-colors hover:bg-white/5"
                          style={{ color: "var(--text-muted)" }}
                          title="Edit"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                          </svg>
                        </Link>
                        <button
                          className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: "var(--danger)" }}
                          title="Delete"
                          onClick={() => setDeleteTarget(article)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!compact && totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: page === pageNum ? "var(--accent-primary)" : "transparent",
                      color: page === pageNum ? "white" : "var(--text-muted)",
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title={`Delete ${itemLabel}`}
        message={
          <>Are you sure you want to delete <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? This action cannot be undone.</>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
