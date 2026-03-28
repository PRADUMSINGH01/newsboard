"use client";

import Sidebar from "../../components/Sidebar";
import NewsForm from "../../components/NewsForm";
import { ToastProvider } from "../../components/Toast";

function NewArticleContent() {
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
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Create New Kahani</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Write and publish a new kahani (story)
            </p>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-6 max-w-7xl">
            <NewsForm mode="create" apiEndpoint="/api/kahani" redirectPath="/kahani" />
        </div>
      </main>
    </div>
  );
}

export default function NewArticlePage() {
  return (
    <ToastProvider>
      <NewArticleContent />
    </ToastProvider>
  );
}
