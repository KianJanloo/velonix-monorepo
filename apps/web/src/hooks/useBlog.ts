"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

export interface BlogPost {
  id: string; slug: string; title: string; excerpt: string;
  content?: string; coverImageUrl: string | null; tags: string[];
  readTimeMinutes: number; viewCount: number;
  publishedAt: string | null; published?: boolean;
  author: { id: string; username: string; displayName: string } | null;
}

export function useBlogPosts(page = 1, perPage = 12, tag?: string, search?: string) {
  return useQuery({
    queryKey: ["blog", { page, perPage, tag, search }],
    queryFn: () => apiClient.get<{ data: BlogPost[]; total: number; totalPages: number }>(
      "/blog", { params: { page, perPage, ...(tag ? { tag } : {}), ...(search ? { search } : {}) } }
    ),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog", slug],
    queryFn: () => apiClient.get<BlogPost>(`/blog/${slug}`),
    enabled: !!slug,
  });
}

export function useAdminBlogPosts(page = 1) {
  return useQuery({
    queryKey: ["admin", "blog", { page }],
    queryFn: () => apiClient.get<{ data: BlogPost[]; total: number; totalPages: number }>(
      "/blog/admin/all", { params: { page } }
    ),
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<BlogPost, "id"|"viewCount"|"author"> & { content: string }) =>
      apiClient.post<BlogPost>("/blog", dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["blog"] });
      void qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Post created!");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create post."),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<BlogPost> & { id: string }) =>
      apiClient.patch<BlogPost>(`/blog/${id}`, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["blog"] });
      void qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Post updated!");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update post."),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/blog/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["blog"] });
      void qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      toast.success("Post deleted.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete post."),
  });
}
