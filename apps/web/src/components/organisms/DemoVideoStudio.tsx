"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BoardPreview, FLYTHROUGH_DURATION } from "@/components/three/BoardPreview";
import { Button } from "@/components/atoms/Button";
import { useGame } from "@/hooks/useGames";

type Phase = "idle" | "recording" | "ready";

/** Picks a webm mime type the browser's MediaRecorder actually supports. */
function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export function DemoVideoStudio({ gameId, gameTitle }: { gameId: string; gameTitle?: string }) {
  const { data: game } = useGame(gameId);
  const title = gameTitle ?? game?.title;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(pickMime() !== null && typeof HTMLCanvasElement.prototype.captureStream === "function");
  }, []);

  // Clean up object URL + any pending timer on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const record = useCallback(() => {
    const canvas = canvasRef.current;
    const mime = pickMime();
    if (!canvas || !mime) {
      toast.error("Video recording isn't supported in this browser.");
      return;
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      setPhase("ready");
    };
    recorderRef.current = rec;
    rec.start();
    setPhase("recording");
    // Capture exactly one full flythrough loop.
    timerRef.current = setTimeout(stop, FLYTHROUGH_DURATION * 1000 + 200);
  }, [stop, videoUrl]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-parchment-light">Demo video</h2>
        <p className="text-soft-gray text-sm font-ui">
          Auto-generate a {FLYTHROUGH_DURATION}s cinematic flythrough of your board to share or embed on the store page.
        </p>
      </div>

      <BoardPreview
        gameId={gameId}
        {...(title ? { gameTitle: title } : {})}
        flythrough
        height={420}
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
            <a
              href={videoUrl}
              download={`${(title ?? "demo").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-flythrough.webm`}
              className="px-4 py-2 rounded-lg border border-warm-wood text-parchment-light text-sm font-ui font-semibold hover:border-emerald-glow/50 hover:text-emerald-glow transition-all"
            >
              Download .webm
            </a>
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
    </div>
  );
}
