"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useBlogPosts } from "@/hooks/useBlog";
import { Pagination } from "@/components/atoms/Pagination";

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading, isError } = useBlogPosts(page, 12, undefined, search || undefined);

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-ui text-xs font-bold tracking-[0.18em] text-emerald-glow uppercase mb-4">The Velonix Journal</p>
          <h1 className="font-display text-5xl font-black tracking-display text-parchment-light mb-4">Blog</h1>
          <p className="font-body text-lg text-parchment-mid italic max-w-xl mx-auto">
            Design insights, platform news, and stories from the board game community.
          </p>
        </div>

        {/* Search */}
        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-gray-dark pointer-events-none" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input className="v-input pl-10" placeholder="Search articles…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }} />
          </div>
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="v-card h-72 animate-pulse" />)}
          </div>
        ) : isError ? (
          <div className="v-card py-16 text-center">
            <p className="text-crimson-flame font-ui text-sm mb-2">Failed to load posts.</p>
            <p className="text-soft-gray text-xs font-ui">Please refresh the page.</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="v-card py-16 text-center">
            <p className="font-display text-parchment-mid text-lg mb-2">No posts yet</p>
            <p className="text-soft-gray text-sm font-ui">Check back soon for design insights and platform news.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group flex flex-col bg-rich-wood-dark border border-warm-wood rounded-xl overflow-hidden hover:border-warm-wood-light hover:-translate-y-0.5 transition-all">
                {/* Cover */}
                <div className="relative h-40 bg-felt-dark overflow-hidden flex items-center justify-center">
                  {post.coverImageUrl ? (
                    <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-20">
                      <polyline points="4,9 20,31 36,9" fill="none" stroke="#f5c451" strokeWidth="3" />
                    </svg>
                  )}
                </div>
                {/* Body */}
                <div className="flex flex-col flex-1 p-5">
                  {post.tags.length > 0 && (
                    <span className="text-2xs text-emerald-glow font-ui uppercase tracking-wider mb-2">{post.tags[0]}</span>
                  )}
                  <h2 className="font-display text-base font-bold tracking-wide text-parchment-light mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-soft-gray font-ui line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-2xs text-soft-gray-dark font-ui pt-3 border-t border-warm-wood">
                    <span>{post.author?.displayName ?? "Velonix"}</span>
                    <span>{post.readTimeMinutes} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} className="mt-12" />
      </div>
    </div>
  );
}
