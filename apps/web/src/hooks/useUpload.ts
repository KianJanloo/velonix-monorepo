"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getAccessToken } from "@/stores/authStore";

const API_ROOT =
  (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001") + "/api/v1";

/** Uploads an image to the API and returns its public URL. */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 5MB.");
      return null;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_ROOT}/uploads/image`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) {
        let msg = "Upload failed.";
        try {
          const j = (await res.json()) as {
            error?: { message?: string };
            message?: string;
          };
          msg = j.error?.message ?? j.message ?? msg;
        } catch {
          /* ignore */
        }
        toast.error(msg);
        return null;
      }
      const json = (await res.json()) as {
        data?: { url: string };
        url?: string;
      };
      return json.data?.url ?? json.url ?? null;
    } catch {
      toast.error("Upload failed. Check your connection.");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading };
}

/** Uploads a generated WebM video blob to the API and returns its public URL. */
export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (blob: Blob, filename = "demo.webm"): Promise<string | null> => {
      if (blob.size > 50 * 1024 * 1024) {
        toast.error("Video too large. Maximum size is 50MB.");
        return null;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", blob, filename);
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_ROOT}/uploads/video`, {
          method: "POST",
          headers,
          body: form,
        });
        if (!res.ok) {
          let msg = "Upload failed.";
          try {
            const j = (await res.json()) as {
              error?: { message?: string };
              message?: string;
            };
            msg = j.error?.message ?? j.message ?? msg;
          } catch {
            /* ignore */
          }
          toast.error(msg);
          return null;
        }
        const json = (await res.json()) as {
          data?: { url: string };
          url?: string;
        };
        return json.data?.url ?? json.url ?? null;
      } catch {
        toast.error("Upload failed. Check your connection.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return { upload, uploading };
}

/** Uploads a recorded voice-note clip (webm/m4a/mp3/wav, max 15MB). */
export function useAudioUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (
      blob: Blob,
      filename = "voice-note.webm",
    ): Promise<string | null> => {
      if (blob.size > 15 * 1024 * 1024) {
        toast.error("Recording too large. Maximum size is 15MB.");
        return null;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", blob, filename);
        const token = getAccessToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_ROOT}/uploads/audio`, {
          method: "POST",
          headers,
          body: form,
        });
        if (!res.ok) {
          let msg = "Upload failed.";
          try {
            const j = (await res.json()) as {
              error?: { message?: string };
              message?: string;
            };
            msg = j.error?.message ?? j.message ?? msg;
          } catch {
            /* ignore */
          }
          toast.error(msg);
          return null;
        }
        const json = (await res.json()) as {
          data?: { url: string };
          url?: string;
        };
        return json.data?.url ?? json.url ?? null;
      } catch {
        toast.error("Upload failed. Check your connection.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return { upload, uploading };
}
