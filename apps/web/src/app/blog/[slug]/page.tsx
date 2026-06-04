"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useBlogPost } from "@/hooks/useBlog";
import { ApiError } from "@/lib/apiClient";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: PostPageProps) {
  const { slug } = use(params);
  const { data: post, isLoading, error } = useBlogPost(slug);

  if (error instanceof ApiError && error.statusCode === 404) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-void">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="h-8 bg-warm-wood/30 rounded w-2/3 mb-4 animate-pulse" />
          <div className="h-4 bg-warm-wood/20 rounded w-1/3 mb-8 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 bg-warm-wood/20 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  // Simple markdown-ish rendering: split paragraphs, headings
  const blocks = post.content?.split("\n").filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <article className="max-w-2xl mx-auto px-6 py-16">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-soft-gray text-sm font-ui hover:text-parchment-light transition-colors mb-8">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          All articles
        </Link>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="text-2xs text-emerald-glow font-ui uppercase tracking-wider bg-emerald-ghost px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-4xl font-black tracking-display text-parchment-light mb-4 leading-tight">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-soft-gray font-ui mb-8 pb-8 border-b border-warm-wood">
          <span className="text-parchment-mid">{post.author?.displayName ?? "Velonix"}</span>
          <span className="text-warm-wood">·</span>
          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
          <span className="text-warm-wood">·</span>
          <span>{post.readTimeMinutes} min read</span>
        </div>

        {/* Cover */}
        {post.coverImageUrl && (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl mb-8 border border-warm-wood"
          />
        )}

        {/* Content */}
        <div className="prose-velonix space-y-5">
          {blocks.map((block, i) => {
            if (block.startsWith("## ")) {
              return <h2 key={i} className="font-display text-2xl font-bold text-parchment-light mt-8 mb-2">{block.slice(3)}</h2>;
            }
            if (block.startsWith("### ")) {
              return <h3 key={i} className="font-display text-xl font-semibold text-parchment-light mt-6 mb-2">{block.slice(4)}</h3>;
            }
            if (block.startsWith("> ")) {
              return <blockquote key={i} className="border-l-2 border-emerald-glow pl-4 italic text-parchment-mid font-body text-lg">{block.slice(2)}</blockquote>;
            }
            if (block.startsWith("- ")) {
              return <li key={i} className="text-parchment-mid font-body text-lg leading-relaxed ml-4">{block.slice(2)}</li>;
            }
            return <p key={i} className="text-parchment-mid font-body text-lg leading-relaxed">{block}</p>;
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-warm-wood text-center">
          <p className="font-display text-lg text-parchment-light mb-4">Ready to create your own game?</p>
          <Link href="/auth/register" className="inline-flex px-6 py-3 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all">
            Start for free
          </Link>
        </div>
      </article>
    </div>
  );
}
