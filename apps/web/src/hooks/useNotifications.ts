"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useCurrentUser } from "@/hooks/useAuth";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationList {
  data: AppNotification[];
  total: number;
  unread: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function useNotifications(enabled = true) {
  const user = useCurrentUser();
  return useQuery<NotificationList>({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<NotificationList>("/notifications"),
    enabled: enabled && !!user,
    refetchInterval: 60_000, // poll every minute
  });
}

export function useUnreadCount() {
  const user = useCurrentUser();
  return useQuery<{ unread: number }>({
    queryKey: ["notifications", "unread"],
    queryFn: () => apiClient.get<{ unread: number }>("/notifications/unread-count"),
    enabled: !!user,
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch("/notifications/read-all"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
