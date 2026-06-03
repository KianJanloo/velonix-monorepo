"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LazyBoardPreview as BoardPreview } from "@/components/three/LazyBoardPreview";
import { FLYTHROUGH_DURATION } from "@/components/three/boardPreview.constants";
import { startStudioMusic } from "@/components/three/studioMusic";
import { Button } from "@/components/atoms/Button";
import { useGame, useUpdateGame } from "@/hooks/useGames";
import { useVideoUpload } from "@/hooks/useUpload";
import { usePlan } from "@/hooks/usePlan";
import { normalizeComponents, type CanvasComp } from "@/components/templates/studio/core";

type Phase = "idle" | "recording" | "ready";

interface Page { id: string; name: string; width: number; height: number; components: CanvasComp[]; }

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  // Prefer codecs that include opus audio so the soundtrack is captured.
  return [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ].find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export function DemoVideoStudio({ gameId, gameTitle }: { gameId: string; gameTitle?: string }) {
  const plan = usePlan();
  const { data: game } = useGame(gameId);
  const updateGame = useUpdateGame(gameId);
  const videoUpload = useVideoUpload();
  const title = gameTitle ?? game?.title;

  // All pages from the game's studio data (legacy single-canvas fallback).
  const pages = useMemo<Page[]>(() => {
    const data = game?.studioData as
      | { components?: unknown; pages?: { id?: string; name?: string; width?: number; height?: number; components?: unknown }[] }
      | null | undefined;
    if (Array.isArray(data?.pages) && data!.pages.length) {
      return data!.pages.map((p, i) => ({
        id: p.id ?? `page-${i}`,
        name: p.name || `Page ${i + 1}`,
        width: p.width ?? 800,
        height: p.height ?? 600,
        components: normalizeComponents(p.components ?? []),
      }));
    }
    return [{ id: "main", name: "Main Board", width: 800, height: 600, components: normalizeComponents(data?.components ?? []) }];
  }, [game?.studioData]);

  const [pageIdx, setPageIdx] = useState(0);
  const page = pages[Math.min(pageIdx, pages.length - 1)]!;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const musicRef = useRef<{ stop: () => void } | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(pickMime() !== null && typeof HTMLCanvasElement.prototype.captureStream === "function");
  }, []);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    musicRef.current?.stop();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const record = useCallback(() => {
    const canvas = canvasRef.current;
    const mime = pickMime();
    if (!canvas || !mime) { toast.error("Video recording isn't supported in this browser."); return; }
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    const videoStream = canvas.captureStream(30);

    // Synthesise a soundtrack and merge its audio track with the canvas video.
    let music: { stream: MediaStream; stop: () => void } | null = null;
    try { music = startStudioMusic(); } catch { /* audio optional */ }
    musicRef.current = music;
    const tracks = [
      ...videoStream.getVideoTracks(),
      ...(music ? music.stream.getAudioTracks() : []),
    ];
    const mixed = new MediaStream(tracks);

    const rec = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      musicRef.current?.stop();
      musicRef.current = null;
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      blobRef.current = blob;
      setVideoUrl(URL.createObjectURL(blob));
      setPhase("ready");
    };
    recorderRef.current = rec;
    rec.start();
    setPhase("recording");
    timerRef.current = setTimeout(stop, FLYTHROUGH_DURATION * 1000 + 200);
  }, [stop, videoUrl]);

  const saveToGame = useCallback(async () => {
    if (!blobRef.current) return;
    const url = await videoUpload.upload(blobRef.current, `${(title ?? "demo").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.webm`);
    if (!url) return;
    try {
      await updateGame.mutateAsync({ demoVideoUrl: url } as never);
      toast.success("Demo video saved to your game.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save video.");
    }
  }, [videoUpload, updateGame, title]);

  // ── Plan gate ────────────────────────────────────────────────────────────
  if (!plan.hasDemoVideo) {
    return (
      <div className="v-card p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-royal-gold/15 border border-royal-gold/30 flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="#f5c451" /></svg>
        </div>
        <h2 className="font-display text-xl font-bold text-parchment-light mb-1">3D demo videos are a Pro feature</h2>
        <p className="text-soft-gray text-sm font-ui mb-5 max-w-sm mx-auto">
          Auto-generate cinematic flythroughs of your board to showcase on the marketplace. Upgrade to unlock it.
        </p>
        <Link href="/pricing" className="v-btn-primary inline-block">View plans</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-parchment-light">Demo video</h2>
          <p className="text-soft-gray text-sm font-ui">
            Auto-generate a {FLYTHROUGH_DURATION}s cinematic flythrough of your board.
          </p>
        </div>
        {pages.length > 1 && (
          <label className="text-2xs font-ui text-soft-gray">
            <span className="block mb-1 uppercase tracking-wider">Page</span>
            <select
              className="v-input text-sm"
              value={pageIdx}
              onChange={(e) => { setPageIdx(Number(e.target.value)); if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); } setPhase("idle"); }}
            >
              {pages.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <BoardPreview
        key={page.id}
        gameId={gameId}
        {...(title ? { gameTitle: title } : {})}
        flythrough
        height={420}
        components={page.components}
        boardWidth={page.width}
        boardHeight={page.height}
        onCanvasReady={(c) => { canvasRef.current = c; }}
        className="border border-warm-wood"
      />

      {!supported ? (
        <p className="text-2xs font-ui text-soft-gray-dark">
          Your browser can't record video here. Try the latest Chrome, Edge, or Firefox.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {phase === "recording" ? (
            <Button variant="danger" onClick={stop}>
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
              Recording… ({FLYTHROUGH_DURATION}s)
            </Button>
          ) : (
            <Button variant="primary" onClick={record}>
              {videoUrl ? "Re-record flythrough" : "Generate demo video"}
            </Button>
          )}
          {videoUrl && phase === "ready" && (
            <>
              <Button variant="outline" isLoading={videoUpload.uploading || updateGame.isPending} onClick={saveToGame}>
                Save to game
              </Button>
              <a
                href={videoUrl}
                download={`${(title ?? "demo").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-flythrough.webm`}
                className="px-4 py-2 rounded-lg border border-warm-wood text-parchment-light text-sm font-ui font-semibold hover:border-emerald-glow/50 hover:text-emerald-glow transition-all"
              >
                Download .webm
              </a>
            </>
          )}
        </div>
      )}

      {videoUrl && (
        <div>
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1.5">Preview</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={videoUrl} controls loop className="w-full rounded-lg border border-warm-wood" />
        </div>
      )}

      {!videoUrl && game?.demoVideoUrl && (
        <div>
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1.5">Saved demo video</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={game.demoVideoUrl} controls loop className="w-full rounded-lg border border-warm-wood" />
        </div>
      )}
    </div>
  );
}
