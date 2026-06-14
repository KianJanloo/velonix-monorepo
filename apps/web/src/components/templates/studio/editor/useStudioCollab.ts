"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/stores/authStore";
import type { CollaboratorRole } from "@velonix/types";

export type StudioRole = "owner" | CollaboratorRole;

export interface PresenceMember {
  socketId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: StudioRole;
}

interface RemoteUpdate {
  snapshot: unknown;
  author: { userId: string; displayName: string };
  at: number;
}

const SOCKET_ORIGIN = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

interface Options {
  gameId: string;
  enabled: boolean;
  /** Apply a snapshot pushed by another editor. */
  onRemoteUpdate: (snapshot: unknown, author: { userId: string; displayName: string }) => void;
  /** Return the current local snapshot so we can answer a newcomer's sync request. */
  getSnapshot: () => unknown;
  /** Apply a drawing stroke pushed by another editor. */
  onRemoteDraw?: (stroke: unknown) => void;
  /** Apply a clear-strokes event pushed by another editor. */
  onRemoteDrawClear?: (pageId: string) => void;
}

/**
 * Connects to the studio collaboration namespace, joins the game room, tracks
 * presence, relays live snapshots, and answers sync requests from newcomers.
 */
export function useStudioCollab({ gameId, enabled, onRemoteUpdate, getSnapshot, onRemoteDraw, onRemoteDrawClear }: Options) {
  const [presence, setPresence] = useState<PresenceMember[]>([]);
  const [role, setRole] = useState<StudioRole | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const onRemoteRef = useRef(onRemoteUpdate);
  const getSnapshotRef = useRef(getSnapshot);
  const onRemoteDrawRef = useRef(onRemoteDraw);
  const onRemoteDrawClearRef = useRef(onRemoteDrawClear);
  onRemoteRef.current = onRemoteUpdate;
  getSnapshotRef.current = getSnapshot;
  onRemoteDrawRef.current = onRemoteDraw;
  onRemoteDrawClearRef.current = onRemoteDrawClear;

  useEffect(() => {
    if (!enabled || !gameId) return;
    const token = getAccessToken();
    if (!token) return;

    const socket = io(`${SOCKET_ORIGIN}/studio`, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("studio:join", { gameId }, (ack?: { ok: boolean; role?: StudioRole }) => {
        setConnected(!!ack?.ok);
        if (ack?.role) setRole(ack.role);
      });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("studio:presence", (p: { members: PresenceMember[] }) => setPresence(p.members ?? []));
    socket.on("studio:update", (u: RemoteUpdate) => onRemoteRef.current(u.snapshot, u.author));
    socket.on("studio:draw", (u: { stroke: unknown }) => onRemoteDrawRef.current?.(u.stroke));
    socket.on("studio:draw-clear", (u: { pageId: string }) => onRemoteDrawClearRef.current?.(u.pageId));
    socket.on("studio:sync-request", () => {
      // A newcomer joined — share our current in-progress design with the room.
      socket.emit("studio:update", { gameId, snapshot: getSnapshotRef.current() });
    });

    return () => {
      socket.emit("studio:leave", { gameId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setPresence([]);
      setRole(null);
    };
  }, [gameId, enabled]);

  const broadcast = useCallback((snapshot: unknown) => {
    socketRef.current?.emit("studio:update", { gameId, snapshot });
  }, [gameId]);

  const broadcastDraw = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, { gameId, ...payload as object });
  }, [gameId]);

  return { presence, role, connected, broadcast, broadcastDraw };
}
