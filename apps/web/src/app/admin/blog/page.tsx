"use client";

import { useState } from "react";
import { useAdminBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost, type BlogPost } from "@/hooks/useBlog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/atoms/Button";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

interface EditorState {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  tags: string;
  published: boolean;
}

const EMPTY: EditorState = {
  slug: "", title: "", excerpt: "", content: "", coverImageUrl: "", tags: "", published: false,
};

export default function AdminBlogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminBlogPosts(page);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [editor, setEditor] = useState<EditorState | null>(null);

  function openNew() { setEditor({ ...EMPTY }); }
  function openEdit(post: BlogPost) {
    setEditor({
      id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
      content: post.content ?? "", coverImageUrl: post.coverImageUrl ?? "",
      tags: post.tags.join(", "), published: post.published ?? false,
    });
  }

  async function save() {
    if (!editor) return;
    const payload = {
      slug: editor.slug || slugify(editor.title),
      title: editor.title,
      excerpt: editor.excerpt,
      content: editor.content,
      coverImageUrl: editor.coverImageUrl || null,
      tags: editor.tags.split(",").map(t => t.trim()).filter(Boolean),
      published: editor.published,
    };
    try {
      if (editor.id) {
        await updatePost.mutateAsync({ id: editor.id, ...payload });
      } else {
        await createPost.mutateAsync(payload as never);
      }
      setEditor(null);
    } catch { /* toast handled in hook */ }
  }

  // ── Editor view ────────────────────────────────────────────────────────────

  if (editor) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-parchment-light">{editor.id ? "Edit Post" : "New Post"}</h1>
          <button onClick={() => setEditor(null)} className="text-soft-gray text-sm font-ui hover:text-parchment-light">← Back to list</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Title</label>
            <input className="v-input" value={editor.title}
              onChange={e => setEditor({ ...editor, title: e.target.value, slug: editor.slug || slugify(e.target.value) })} />
          </div>
          <div>
            <label className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Slug</label>
            <input className="v-input font-mono text-sm" value={editor.slug}
              onChange={e => setEditor({ ...editor, slug: e.target.value })} />
          </div>
          <div>
            <label className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Excerpt</label>
            <textarea className="v-input resize-none h-20" value={editor.excerpt}
              onChange={e => setEditor({ ...editor, excerpt: e.target.value })} />
          </div>
          <ImageUploadField
            label="Cover Image"
            shape="cover"
            value={editor.coverImageUrl || null}
            onChange={(url) => setEditor({ ...editor, coverImageUrl: url ?? "" })}
            hint="Recommended 1200×630. Max 5MB."
          />
          <div>
            <label className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Tags (comma separated)</label>
            <input className="v-input" value={editor.tags} placeholder="design, strategy, news"
              onChange={e => setEditor({ ...editor, tags: e.target.value })} />
          </div>
          <div>
            <label className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Content (Markdown supported)</label>
            <textarea className="v-input resize-none h-80 font-mono text-sm" value={editor.content}
              onChange={e => setEditor({ ...editor, content: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editor.published}
              onChange={e => setEditor({ ...editor, published: e.target.checked })}
              className="w-4 h-4 rounded border-warm-wood bg-rich-wood-mid accent-emerald-glow" />
            <span className="text-sm text-parchment-light font-ui">Published</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button>
            <Button variant="primary" onClick={save} isLoading={createPost.isPending || updatePost.isPending}
              disabled={!editor.title || !editor.excerpt || !editor.content}>
              {editor.id ? "Save Changes" : "Create Post"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Blog Posts</h1>
        <Button variant="primary" onClick={openNew}>+ New Post</Button>
      </div>

      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-warm-wood">
            <tr>
              {["Title", "Status", "Views", "Published", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-2xs font-ui font-bold text-soft-gray uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-warm-wood/30">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-wood/30 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-soft-gray font-ui text-sm">No posts yet. Create your first one.</td></tr>
            ) : data?.data.map(post => (
              <tr key={post.id} className="border-b border-warm-wood/20 hover:bg-warm-wood/10 transition-colors">
                <td className="px-4 py-3 max-w-[280px]">
                  <p className="text-sm font-ui text-parchment-light truncate">{post.title}</p>
                  <p className="text-2xs text-soft-gray font-mono">/{post.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-ui ${post.published ? "bg-emerald-ghost text-emerald-glow" : "bg-warm-wood text-soft-gray"}`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-soft-gray">{post.viewCount ?? 0}</td>
                <td className="px-4 py-3 text-2xs text-soft-gray-dark font-mono">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(post)} className="text-emerald-glow text-xs font-ui hover:text-emerald-bright transition-colors">Edit</button>
                    <ConfirmDialog
                      title="Delete post?"
                      description={`"${post.title}" will be permanently deleted.`}
                      confirmLabel="Delete"
                      variant="danger"
                      onConfirm={() => deletePost.mutateAsync(post.id)}
                    >
                      {(open) => <button onClick={open} className="text-crimson-flame text-xs font-ui hover:text-crimson-bright transition-colors">Delete</button>}
                    </ConfirmDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-warm-wood text-sm font-ui text-soft-gray disabled:opacity-40">← Prev</button>
          <span className="text-xs text-soft-gray font-ui">Page {page} of {data.totalPages}</span>
          <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-warm-wood text-sm font-ui text-soft-gray disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
