"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NewsFormData, NEWS_TAGS, ArticleSection } from "@/lib/types";
import { useToast } from "./Toast";
import SeoScorer from "./SeoScorer";

interface NewsFormProps {
  initialData?: NewsFormData & { id?: string };
  mode: "create" | "edit";
  apiEndpoint?: string;
  redirectPath?: string;
}

export default function NewsForm({ initialData, mode, apiEndpoint = "/api/news", redirectPath = "/articles" }: NewsFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [useBuilder, setUseBuilder] = useState(mode === "create" ? true : false);

  const [form, setForm] = useState<NewsFormData>({
    title: "",
    slug: "",
    tag: "",
    img: "",
    excerpt: "",
    content: "",
    sections: [],
    author: "",
    avatar: "",
  });

  useEffect(() => {
    if (initialData) {
      // Handle legacy Array content
      let parsedContent = initialData.content || "";
      let activeSections = initialData.sections || [];
      let shouldEnableBuilder = activeSections.length > 0;

      if (Array.isArray(parsedContent)) {
        activeSections = parsedContent.map((blk: any) => {
          let subheading = "";
          let paragraph = "";
          if (blk.type === "heading" || blk.type === "subheading") subheading = blk.text || "";
          else if (blk.type === "paragraph") paragraph = blk.text || "";
          
          return {
            subheading,
            paragraph,
            image: blk.imagePreview || blk.image || "",
          };
        });
        parsedContent = ""; 
        shouldEnableBuilder = true;
      }

      setForm({
        title: initialData.title || "",
        slug: initialData.slug || "",
        tag: initialData.tag || "",
        img: initialData.img || "",
        excerpt: initialData.excerpt || "",
        content: typeof parsedContent === "string" ? parsedContent : "",
        sections: activeSections,
        author: initialData.author || "",
        avatar: initialData.avatar || "",
      });

      if (shouldEnableBuilder) {
        setUseBuilder(true);
      }
    }
  }, [initialData]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  };

  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: mode === "create" ? generateSlug(val) : prev.slug,
    }));
  };

  const handleChange = (field: keyof NewsFormData, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const buildContentHtml = (sections: ArticleSection[]) => {
    return sections
      .map((sec) => {
        let html = "";
        if (sec.subheading) html += `<h2>${sec.subheading}</h2>\n`;
        if (sec.image) html += `<img src="${sec.image}" alt="${sec.subheading || 'section image'}" />\n`;
        if (sec.paragraph) html += `<p>${sec.paragraph.replace(/\n/g, "<br/>")}</p>\n`;
        return html;
      })
      .join("\n");
  };

  const handleSectionChange = (index: number, field: keyof ArticleSection, val: string) => {
    setForm((prev) => {
      const updatedSections = [...(prev.sections || [])];
      updatedSections[index] = { ...updatedSections[index], [field]: val };
      return { 
        ...prev, 
        sections: updatedSections,
        content: buildContentHtml(updatedSections)
      };
    });
  };

  const addSection = () => {
    setForm((prev) => {
      const updatedSections = [...(prev.sections || []), { subheading: "", paragraph: "", image: "" }];
      return { ...prev, sections: updatedSections, content: buildContentHtml(updatedSections) };
    });
    setUseBuilder(true);
  };

  const removeSection = (index: number) => {
    setForm((prev) => {
      const updatedSections = [...(prev.sections || [])];
      updatedSections.splice(index, 1);
      return { ...prev, sections: updatedSections, content: buildContentHtml(updatedSections) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setLoading(true);

    try {
      const url = mode === "edit" ? `${apiEndpoint}/${initialData?.id}` : apiEndpoint;
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(mode === "create" ? "Article created successfully!" : "Article updated successfully!", "success");
        router.push(redirectPath);
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "Something went wrong", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Form — takes 2/3 */}
      <form onSubmit={handleSubmit} className="xl:col-span-2 animate-fade-in-up space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Title <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="text"
            className="input-dark text-lg font-semibold"
            placeholder="Enter article title..."
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>/</span>
            <input
              type="text"
              className="input-dark font-mono text-sm"
              placeholder="auto-generated-slug"
              value={form.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
            />
          </div>
        </div>

        {/* Row: Tag + Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Category
            </label>
            <select
              className="input-dark"
              value={form.tag}
              onChange={(e) => handleChange("tag", e.target.value)}
            >
              <option value="">Select category...</option>
              {NEWS_TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Author
            </label>
            <input
              type="text"
              className="input-dark"
              placeholder="Author name"
              value={form.author}
              onChange={(e) => handleChange("author", e.target.value)}
            />
          </div>
        </div>

        {/* Row: Image + Avatar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Main Image URL
            </label>
            <input
              type="url"
              className="input-dark"
              placeholder="https://..."
              value={form.img}
              onChange={(e) => handleChange("img", e.target.value)}
            />
            {form.img && (
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                <img
                  src={form.img}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Author Avatar URL
            </label>
            <input
              type="url"
              className="input-dark"
              placeholder="https://..."
              value={form.avatar}
              onChange={(e) => handleChange("avatar", e.target.value)}
            />
            {form.avatar && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={form.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: "2px solid var(--border-subtle)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{form.author || "Author"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Excerpt / Meta Description
          </label>
          <textarea
            className="input-dark resize-none"
            rows={3}
            placeholder="Short description of the article..."
            value={form.excerpt}
            onChange={(e) => handleChange("excerpt", e.target.value)}
          />
        </div>

        {/* Content Section Builder */}
        <div className="pt-4 border-t border-dashed" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Article Content</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Raw HTML</span>
              <button 
                type="button" 
                onClick={() => setUseBuilder(!useBuilder)}
                className={`w-10 h-5 rounded-full relative transition-colors ${useBuilder ? "bg-accent" : "bg-elevated"}`}
                style={{ background: useBuilder ? "var(--accent-primary)" : "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${useBuilder ? "right-1" : "left-1"}`}></div>
              </button>
              <span className="text-xs" style={{ color: "var(--text-primary)" }}>Section Builder</span>
            </div>
          </div>

          {!useBuilder ? (
            <textarea
              className="input-dark resize-vertical font-mono text-sm"
              rows={12}
              placeholder="Full article content (HTML supported)..."
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
            />
          ) : (
            <div className="space-y-4">
              {(form.sections || []).map((section, idx) => (
                <div key={idx} className="p-4 rounded-xl space-y-4 relative" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Section {idx + 1}</span>
                    <button type="button" onClick={() => removeSection(idx)} className="text-xs font-medium px-2 py-1 rounded" style={{ color: "var(--danger)", background: "rgba(239,68,68,0.1)" }}>
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subheading</label>
                    <input type="text" className="input-dark bg-transparent font-semibold border" style={{ borderColor: "var(--border-subtle)" }}
                      placeholder="e.g. The Main Event" value={section.subheading} onChange={(e) => handleSectionChange(idx, "subheading", e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Section Image URL</label>
                    <input type="url" className="input-dark bg-transparent border text-sm" style={{ borderColor: "var(--border-subtle)" }}
                      placeholder="https://..." value={section.image} onChange={(e) => handleSectionChange(idx, "image", e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Paragraph</label>
                    <textarea className="input-dark bg-transparent resize-vertical text-sm border" rows={4} style={{ borderColor: "var(--border-subtle)" }}
                      placeholder="Write your news content here..." value={section.paragraph} onChange={(e) => handleSectionChange(idx, "paragraph", e.target.value)} />
                  </div>
                </div>
              ))}

              <button type="button" onClick={addSection} className="w-full py-3 rounded-xl border border-dashed flex items-center justify-center gap-2 hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="M12 5v14"/>
                </svg>
                <span className="text-sm font-semibold">Add New Section</span>
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {loading ? "Saving..." : mode === "create" ? "Publish Article" : "Save Changes"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>

      {/* SEO Scorer — takes 1/3 */}
      <div className="xl:col-span-1">
        <div className="sticky top-20">
          <SeoScorer formData={form} />
        </div>
      </div>
    </div>
  );
}
